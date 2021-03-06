import { ParseError } from '../parser';
import { Tokens, Token } from '../tokenizer';
import { isLeft, Either, left, right } from 'fp-ts/lib/Either';
import { VariableDeclaration } from '../variable-declaration';
import { FunctionDeclaration } from '../function-declaration';
import {
    consumeAndLiftListContents,
    consumeExpression,
    consumeIfUntilThen,
    consumeThenUntilElse,
    consumeElseUntilEnd,
    consumeChord,
} from './consumers';
import { precedence, opReturnTypeMap } from './utils';
import { LiteralExp, isLiteral, liftTokenIntoLiteral, LiteralRhythm } from './literal';
export type Expression = IfExp | VarExp | OpExp | LiteralExp | FunctionApplication;

export interface IfExp {
    _type: 'IfExp';
    condition: Expression;
    thenBranch: Expression;
    elseBranch?: Expression;
    returnType: string;
    token: Token;
}

export interface VarExp {
    _type: 'VarExp';
    varName: Token;
    returnType: string;
    token: Token;
}

export interface OpExp {
    _type: 'OpExp';
    left: Expression;
    right: Expression;
    operator: Operator;
    returnType: string;
    token: Token;
}

export interface FunctionApplication {
    _type: 'FunctionApplication';
    functionName: Token;
    args: Expression[];
    returnType: string;
    token: Token;
}

export interface Operator {
    operatorType: '+' | '-' | '/' | '%' | '(' | '*' | '==' | '>=' | '<=' | '>' | '<' | '||' | '&&' | '!=';
    value: Token;
}

/// If input is a valid expression, determine what type of expression it is and parse
/// it into an elevated type of that expression. Otherwise, return a ParseError.
// a lot of this function was inspired by this page
//     https://www.geeksforgeeks.org/expression-evaluation/
export function parseExpression(
    input: Tokens,
    functionNamespace: FunctionDeclaration[],
    variableNamespace: VariableDeclaration[],
    params: { varName: Token; varType: Token }[] = [],
): Either<ParseError, { input: Tokens; expression: Expression }> {
    // Extract the expression out of the beginning of the input.
    const result = consumeExpression(input);
    if (isLeft(result)) {
        return result;
    }
    input = result.right.input;

    let expressionContents = result.right.tokens;

    let expressionStack: Expression[] = [];
    let operatorStack: Operator[] = [];
    // We continually take the first token in the expression and try to reduce it.
    while (expressionContents.length > 0 && expressionContents[0].tokenType !== 'statement-terminator') {
        if (expressionContents[0].tokenType === 'name') {
            // If the token is some sort of identifier, it should be in either the function or variable namespace.
            let matchingVariables = variableNamespace.filter(
                x => x.varName.value.value === expressionContents[0].value.value,
            );
            let matchingParams = params.filter(x => x.varName.value.value === expressionContents[0].value.value);
            let matchingFunctions = functionNamespace.filter(
                x => x.functionName.value.value === expressionContents[0].value.value,
            );
            // If nothing in the namespace matched, then this is an undeclared variable.
            if (matchingVariables.length === 0 && matchingFunctions.length === 0 && matchingParams.length === 0) {
                return left({
                    line: expressionContents[0].value.line,
                    column: expressionContents[0].value.column,
                    reason: `Identifier "${expressionContents[0].value.value}" has not been declared`,
                });
            }
            // TODO redo the below error messages to include params
            // As an invariant, there should never be more than one thing in either of these arrays, and at least one
            // of them must have a length of zero.
            if (matchingVariables.length > 0 && matchingFunctions.length > 0) {
                return left({
                    line: expressionContents[0].value.line,
                    column: expressionContents[0].value.column,
                    reason: `Ambiguous name: "${expressionContents[0].value.value}" could be either a variable (defined on line ${matchingVariables[0].varName.value.line}) or a function (defined on line ${matchingFunctions[0].functionName.value.line})`,
                });
            }
            if (matchingVariables.length > 1 || matchingFunctions.length > 1) {
                return left({
                    line: expressionContents[0].value.line,
                    column: expressionContents[0].value.column,
                    reason: `Multiple matches in environment for name "${expressionContents[0].value.value}"`,
                });
            }
            if (matchingVariables.length > 0) {
                expressionStack.push({
                    _type: 'VarExp',
                    varName: expressionContents[0],
                    returnType: matchingVariables[0].varType.value.value,
                    token: expressionContents[0],
                });
                expressionContents.shift();
            } else if (matchingParams.length > 0) {
                let returnType = matchingParams[0].varType.value.value;
                expressionStack.push({
                    _type: 'VarExp',
                    varName: expressionContents[0],
                    returnType,
                    token: expressionContents[0],
                });
                expressionContents.shift();
            } else if (matchingFunctions.length === 1) {
                // get the args out of the following parenthesis
                const numberOfArgs = matchingFunctions[0].parameters.length;
                const functionName = matchingFunctions[0].functionName;
                let rover = expressionContents[0];
                let args: Expression[] = [];
                // Special case handling for no argument functions to skip the whole arg parsing phase
                let name = expressionContents.shift()!;
                if (numberOfArgs === 0) {
                    let leftParens = expressionContents.shift();
                    let rightParens = expressionContents.shift();
                    if (
                        leftParens === undefined ||
                        rightParens === undefined ||
                        leftParens.value.value !== '(' ||
                        rightParens.value.value !== ')'
                    ) {
                        return left({
                            line: name.value.line,
                            column: name.value.column,
                            reason: `Malformed function application. It should look like this: ${name.value.value}(), as the function ${name.value.value} takes no arguments.`,
                        });
                    }
                } else {
                    const leftParens = expressionContents.shift();
                    if (leftParens === undefined) {
                        return left({
                            line: name.value.line,
                            column: name.value.column,
                            reason: `Unexpected EOF after function call "${name.value.value}". Expected an opening parenthesis "("`,
                        });
                    }
                    if (leftParens.value.value !== '(') {
                        return left({
                            line: name.value.line,
                            column: name.value.column,
                            reason: `Expected an opening parenthesis "(" after function call "${name.value.value}". Instead, received a "${leftParens.value.value}".`,
                        });
                    }
                    while (args.length < numberOfArgs) {
                        let prevToken = rover;
                        rover = expressionContents.shift()!;
                        if (rover === undefined) {
                            return left({
                                line: prevToken.value.line,
                                column: prevToken.value.column,
                                reason: `Unexpected end of expression while parsing arguments for function "${functionName.value.value}." Expected ${numberOfArgs} arguments, but only received ${args.length} arguments.`,
                            });
                        }
                        // there could be any sort of expression between here and the next comma
                        // so we first consume until the next comma if this is not the last arg,
                        // and until the last closing parens if it is the last arg
                        // ```
                        // foo(a, b, c)
                        // ``` ^ we are parsing this part right now.
                        //       notice that the "terminator" of this expression is a comma if the
                        //       current arg is not the last argument
                        //
                        // Now we handle the case where there is a nested expression in the function
                        // application, like this:
                        // foo(bar(x + 20, b), 10, (c / 2))
                        const isLastArg = args.length + 1 === numberOfArgs;
                        const terminator = isLastArg ? 'parens' : 'comma';

                        if (terminator === 'parens') {
                            let openingParensCount = 1;
                            let closingParensCount = 0;

                            let expressionBuffer = [];
                            while (openingParensCount > closingParensCount) {
                                expressionBuffer.push(rover);
                                prevToken = rover;
                                rover = expressionContents.shift()!;
                                if (rover.value.value === '(') {
                                    openingParensCount += 1;
                                } else if (rover.value.value === ')') {
                                    closingParensCount += 1;
                                }
                            }
                            // This is not optimal, but we need to add a semicolon to every expression in the function args
                            // in order for the parse to work.
                            expressionBuffer.push({
                                tokenType: 'statement-terminator' as const,
                                value: {
                                    line: 0,
                                    column: 0,
                                    value: ';',
                                },
                            });
                            let result = parseExpression(
                                expressionBuffer,
                                functionNamespace,
                                variableNamespace,
                                params,
                            );
                            if (isLeft(result)) {
                                return result;
                            }
                            args.push(result.right.expression);
                        } else if (terminator === 'comma') {
                            let openingParensCount = 0;
                            let closingParensCount = 0;
                            let seenOuterComma = false;
                            let expressionBuffer = [];
                            while (!seenOuterComma) {
                                if (rover.value.value === '(') {
                                    openingParensCount += 1;
                                } else if (rover.value.value === ')') {
                                    closingParensCount += 1;
                                }
                                // If we have seen an "outer comma", i.e. a comma outside of any inner expressions
                                //
                                //            inner comma
                                //               |
                                //               V
                                // foo (x, (bar(2, 10)), z);
                                //       ^             ^
                                //       |             |
                                //   outer comma   outer comma
                                //
                                if (rover.tokenType !== 'comma') {
                                    expressionBuffer.push(rover);
                                }

                                rover = expressionContents.shift()!;
                                if (rover === undefined) {
                                    return left({
                                        line: prevToken.value.line,
                                        column: prevToken.value.column,
                                        reason: `Unexpected end of expression while parsing arguments for function "${functionName.value.value}." Expected ${numberOfArgs} arguments, but only received ${args.length} arguments.`,
                                    });
                                }
                                seenOuterComma =
                                    openingParensCount === closingParensCount && rover.tokenType === 'comma';
                                prevToken = rover;
                            }
                            // This is not optimal, but we need to add a semicolon to every expression in the function args
                            // in order for the parse to work.
                            expressionBuffer.push({
                                tokenType: 'statement-terminator' as const,
                                value: {
                                    line: 0,
                                    column: 0,
                                    value: ';',
                                },
                            });

                            let result = parseExpression(
                                expressionBuffer,
                                functionNamespace,
                                variableNamespace,
                                params,
                            );
                            if (isLeft(result)) {
                                return result;
                            }
                            args.push(result.right.expression);
                        }
                    }
                }
                let returnType = matchingFunctions[0].returnType.value.value;
                // Now we have the arguments and the function name, so we can add it to the expression stack.
                expressionStack.push({
                    _type: 'FunctionApplication',
                    functionName,
                    args,
                    returnType,
                    token: functionName,
                });
            } else {
                return left({
                    line: 0,
                    column: 0,
                    reason: `Internal compiler error #000. Please submit the code that triggered this error as an issue to https://github.com/sezna/sky.`,
                });
            }
        } else if (expressionContents[0].tokenType === 'operator') {
            const thisOperator = expressionContents[0];
            while (
                operatorStack.length > 0 &&
                precedence(operatorStack[operatorStack.length - 1].value.value.value) >=
                    precedence(thisOperator.value.value)
            ) {
                const newOp = operatorStack.pop()!;
                const rhs = expressionStack.pop()!;
                const lhs = expressionStack.pop()!;
                let returnTypeResult = opReturnTypeMap(
                    lhs.returnType,
                    rhs.returnType,
                    newOp.value.value.value as Operator['operatorType'],
                ); // is this a valid cast?
                if (isLeft(returnTypeResult)) {
                    return left({
                        line: newOp.value.value.line,
                        column: newOp.value.value.column,
                        reason: returnTypeResult.left,
                    });
                }
                let returnType = returnTypeResult.right;
                let operation = {
                    _type: 'OpExp' as const,
                    operator: newOp,
                    right: rhs,
                    left: lhs,
                    returnType,
                    token: newOp.value,
                };
                expressionStack.push(operation);
            }
            operatorStack.push({
                operatorType: expressionContents[0].value.value as any, // will just have to have faith here
                value: expressionContents[0],
            });
            let prevToken = expressionContents[0];
            let res = expressionContents.shift();
            if (res === undefined) {
                return left({
                    line: prevToken.value.line,
                    column: prevToken.value.column,
                    reason: `Unexpected EOF after operator "${prevToken.value.value}"`,
                });
            }
        } else if (isLiteral(expressionContents[0])) {
            let literalParseResult = liftTokenIntoLiteral(expressionContents[0]);
            if (isLeft(literalParseResult)) {
                return literalParseResult;
            }
            let { literalValue } = literalParseResult.right;
            let literalExp = { _type: 'LiteralExp' as const, literalValue, returnType: literalValue.returnType };
            expressionStack.push(literalExp);
            expressionContents.shift();
        } else if (expressionContents[0].tokenType === 'parens') {
            if (expressionContents[0].value.value === '(') {
                operatorStack.push({
                    operatorType: '(',
                    value: expressionContents[0],
                });
            } else {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].value.value.value !== '(') {
                    let operator = operatorStack.pop()!;
                    let rhs = expressionStack.pop()!;
                    let lhs = expressionStack.pop()!;
                    let returnTypeResult = opReturnTypeMap(
                        lhs.returnType,
                        rhs.returnType,
                        operator.value.value.value as Operator['operatorType'],
                    );
                    if (isLeft(returnTypeResult)) {
                        return left({
                            line: operator.value.value.line,
                            column: operator.value.value.column,
                            reason: returnTypeResult.left,
                        });
                    }
                    let returnType = returnTypeResult.right;
                    expressionStack.push({
                        _type: 'OpExp' as const,
                        operator,
                        left: lhs,
                        right: rhs,
                        returnType,
                        token: operator.value,
                    });
                }
                // This discards the opening parenthesis in the op stack.
                let openParens = operatorStack.pop();
                if (openParens && openParens.value.value.value !== '(') {
                    return left({
                        line: 0,
                        column: 0,
                        reason: `Compiler error ERR001, please file an issue at https://github.com/sezna/sky with the code that triggered this error.`,
                    });
                }
            }
            // Now we have handled both parens cases and we can shift the input to the next token.
            expressionContents.shift();
        } else if (expressionContents[0].value.value === '[') {
            let openBracketToken = expressionContents[0];
            let listContentsResult = consumeAndLiftListContents(
                expressionContents,
                functionNamespace,
                variableNamespace,
            );
            if (isLeft(listContentsResult)) {
                return listContentsResult;
            }
            let returnType;
            if (listContentsResult.right.listContents.length === 0) {
                // if the list is empty, this could be any type
                returnType = 'list any';
            } else {
                returnType = 'list ' + listContentsResult.right.listContents[0].returnType;
            }
            let literalValue = {
                _type: 'LiteralList' as const,
                listContents: listContentsResult.right.listContents,
                token: openBracketToken,
                returnType,
            };
            expressionStack.push({
                _type: 'LiteralExp' as const,
                literalValue,
                returnType, // again, this will be literalValue.returnType once that gets added
            });
        } else if (expressionContents[0].value.value === 'if') {
            // consume the stuff in between "if" and "then" and parse an expression out of it
            let token = expressionContents[0]; // for error messages, keep track of the token
            let result = consumeIfUntilThen(expressionContents);
            if (isLeft(result)) {
                return result;
            }
            expressionContents = result.right.input;
            let conditionResult = parseExpression(
                [
                    ...result.right.tokens,
                    {
                        tokenType: 'statement-terminator' as const,
                        value: {
                            line: 0,
                            column: 0,
                            value: ';',
                        },
                    },
                ],
                functionNamespace,
                variableNamespace,
                params,
            );
            if (isLeft(conditionResult)) {
                return conditionResult;
            }
            let condition = conditionResult.right.expression;
            // Now, get the "then" part of the expression.
            result = consumeThenUntilElse(expressionContents);
            if (isLeft(result)) {
                return result;
            }
            let thenBranchResult = parseExpression(
                [
                    ...result.right.tokens,
                    {
                        tokenType: 'statement-terminator' as const,
                        value: {
                            line: 0,
                            column: 0,
                            value: ';',
                        },
                    },
                ],
                functionNamespace,
                variableNamespace,
                params,
            );
            if (isLeft(thenBranchResult)) {
                return thenBranchResult;
            }

            let thenBranch = thenBranchResult.right.expression;
            let elseBranch;
            if (expressionContents.length > 0 && expressionContents[0].tokenType === 'else') {
                result = consumeElseUntilEnd(expressionContents);
                if (isLeft(result)) {
                    return result;
                }
                let elseBranchResult = parseExpression(
                    [
                        ...result.right.tokens,
                        {
                            tokenType: 'statement-terminator' as const,
                            value: {
                                line: 0,
                                column: 0,
                                value: ';',
                            },
                        },
                    ],
                    functionNamespace,
                    variableNamespace,
                    params,
                );
                if (isLeft(elseBranchResult)) {
                    return elseBranchResult;
                }
                elseBranch = elseBranchResult.right.expression;
            } else {
                elseBranch = undefined;
            }
            // Typecheck the condition to be boolean and that the two branches return the same type.
            if (condition.returnType !== 'boolean') {
                return left({
                    line: token.value.line,
                    column: token.value.column,
                    reason: `Condition of if expression does not return a boolean`,
                });
            }
            if (elseBranch && elseBranch.returnType !== thenBranch.returnType) {
                return left({
                    line: token.value.line,
                    column: token.value.column,
                    reason: `Branches of if expression do not return the same type. The "then" branch returns type ${thenBranch.returnType} but the "else" branch returns type ${elseBranch.returnType}`,
                });
            }
            // If there is no else branch, then this must return 'none'
            let returnType;
            if (!elseBranch) {
                returnType = 'none';
            } else {
                returnType = thenBranch.returnType;
            }

            expressionStack.push({
                _type: 'IfExp',
                condition,
                thenBranch,
                elseBranch,
                returnType,
                token,
            });
        } else if (expressionContents[0].tokenType == 'rhythm-literal') {
            let exp = expressionContents.shift()!;
            let rhythmResult = liftTokenIntoLiteral(exp);
            if (isLeft(rhythmResult)) {
                return rhythmResult;
            }
            expressionStack.push(rhythmResult.right);
        } else if (expressionContents[0].tokenType === 'chord-container') {
            let token = expressionContents[0];
            // chords are denoted by backslashes
            // like this: \c4, e4, g4\ quarter
            // that's a c major quarter chord
            // we parse it as a series of literal pitches
            let res = consumeChord(expressionContents, functionNamespace, variableNamespace);
            if (isLeft(res)) {
                return res;
            }

            expressionContents = res.right.input;

            let notes = res.right.pitches;
            if (expressionContents[0]?.tokenType === 'rhythm-literal') {
                let rhythmResult = liftTokenIntoLiteral(expressionContents[0]);
                if (isLeft(rhythmResult)) {
                    return rhythmResult;
                }
                expressionContents.shift();
                let rhythm = rhythmResult.right.literalValue as LiteralRhythm;
                expressionStack.push({
                    _type: 'LiteralExp',
                    literalValue: {
                        _type: 'LiteralPitchRhythm',
                        pitches: notes,
                        rhythm,
                        token,
                        returnType: 'pitch_rhythm',
                    },
                    returnType: 'pitch_rhythm',
                });
            } else {
                expressionStack.push({
                    _type: 'LiteralExp',
                    literalValue: {
                        _type: 'LiteralPitch',
                        token,
                        pitches: notes,
                        returnType: 'pitch',
                    },
                    returnType: 'pitch',
                });
            }
        } else if (expressionContents[0].tokenType === 'loop-keyword') {
            return left({
                line: 0,
                column: 0,
                reason:
                    "Internal compiler error: attempted to parse a loop as an expression, which it isn't. Please file an issue at https://github.com/sezna/sky and include the code which triggered this issue.",
            });
        } else {
            return left({
                line: expressionContents[0].value.line,
                column: expressionContents[0].value.column,
                reason: `Unimplemented feature: ${expressionContents[0].value.value} (${expressionContents[0].tokenType}) in this position is unimplemented`,
            });
        }
    }

    while (operatorStack.length > 0) {
        let operator = operatorStack.pop()!;
        let rhs = expressionStack.pop()!;
        let lhs = expressionStack.pop()!;
        let returnType;
        let returnTypeResult = opReturnTypeMap(
            lhs.returnType,
            rhs.returnType,
            operator.value.value.value as Operator['operatorType'],
        ); // is this a valid cast?
        if (operator.value.value.value !== '(') {
            if (isLeft(returnTypeResult)) {
                return left({
                    line: operator.value.value.line,
                    column: operator.value.value.column,
                    reason: returnTypeResult.left,
                });
            }
            returnType = returnTypeResult.right;
        } else {
            returnType = lhs.returnType;
        }

        let operation = {
            _type: 'OpExp' as const,
            operator,
            right: rhs,
            left: lhs,
            returnType,
            token: operator.value,
        };
        expressionStack.push(operation);
    }
    if (expressionStack.length > 1) {
        let token =
            expressionStack[0]._type === 'LiteralExp'
                ? (expressionStack[0] as LiteralExp).literalValue.token
                : (expressionStack[0] as any).token;
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Overflowed expression. Is there a missing comma or semicolon here?`,
        });
        /*
        console.warn(
            'There is an overflowed expressionStack. Perhaps something is wrong?',
            JSON.stringify(expressionStack, null, 2),
        );
         */
    }

    return right({
        input: input,
        expression: expressionStack[0],
    });
}
