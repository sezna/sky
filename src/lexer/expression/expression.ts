import { ParseError } from '../parser';
import { Tokens, Token } from '../tokenizer';
import { isLeft, Either, left, right } from 'fp-ts/lib/Either';
import { VariableDeclaration } from '../variable-declaration';
import { FunctionDeclaration } from '../function-declaration';
import { consumeExpression, consumeIfUntilThen, consumeThenUntilElse, consumeElseUntilEnd } from './consumers';
import { isLiteral, precedence } from './utils';
export type Expression = IfExp | VarExp | OpExp | Literal | FunctionApplication;

interface IfExp {
    condition: Expression;
    thenBranch: Expression;
    elseBranch?: Expression;
}

export interface VarExp {
    _type: 'VarExp';
    varName: Token;
}

export interface OpExp {
    _type: 'OpExp';
    left: Expression;
    right: Expression;
    operator: Operator;
}

interface FunctionApplication {
    functionName: Token;
    args: Expression[];
}

interface Operator {
    operatorType: '+' | '-' | '/' | '%' | '(';
    value: Token;
}

export interface Literal {
    _type: 'Literal';
    literalType: 'number' | 'unimplemented';
    literalValue: string | number; // of course TODO
}

/// If input is a valid expression, determine what type of expression it is and parse
/// it into an elevated type of that expression. Otherwise, return a ParseError.
// a lot of this function was inspired by this page
//     https://www.geeksforgeeks.org/expression-evaluation/
export function parseExpression(
    input: Tokens,
    functionNamespace: FunctionDeclaration[],
    variableNamespace: VariableDeclaration[],
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
        console.log('expressionContents: ', expressionContents.map(x => x.value.value));
        if (expressionContents[0].tokenType === 'name') {
            // If the token is some sort of identifier, it should be in either the function of variable namespace.
            let matchingVariables = variableNamespace.filter(
                x => x.varName.value.value === expressionContents[0].value.value,
            );
            let matchingFunctions = functionNamespace.filter(
                x => x.functionName.value.value === expressionContents[0].value.value,
            );
            // If nothing in the namespace matched, then this is an undeclared variable.
            if (matchingVariables.length === 0 && matchingFunctions.length === 0) {
                return left({
                    line: expressionContents[0].value.line,
                    column: expressionContents[0].value.column,
                    reason: `Identifier "${expressionContents[0].value.value}" has not been declared`,
                });
            }
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
                expressionStack.push({ _type: 'VarExp', varName: expressionContents[0] });
                expressionContents.shift();
            } else if (matchingFunctions.length === 1) {
                // get the args out of the following parenthesis
                const numberOfArgs = matchingFunctions[0].args.length;
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
                }
                const leftParens = expressionContents.shift();
                if (leftParens === undefined) {
                    return left({
                        line: name.value.line,
                        column: name.value.column,
                        reason: `Unexpected EOF after function name "${name.value.value}". Expected an opening parenthesis "("`,
                    });
                }
                if (leftParens.value.value !== '(') {
                    return left({
                        line: name.value.line,
                        column: name.value.column,
                        reason: `Expected an opening parenthesis "(" after function name "${name.value.value}". Instead, received a "${leftParens.value.value}".`,
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
                        let result = parseExpression(expressionBuffer, functionNamespace, variableNamespace);
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
                            seenOuterComma = openingParensCount === closingParensCount && rover.tokenType === 'comma';
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

                        let result = parseExpression(expressionBuffer, functionNamespace, variableNamespace);
                        if (isLeft(result)) {
                            return result;
                        }
                        args.push(result.right.expression);
                    }
                }
                // Now we have the arguments and the function name, so we can add it to the expression stack.
                expressionStack.push({
                    functionName,
                    args,
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
                const right = expressionStack.pop()!;
                const left = expressionStack.pop()!;
                let operation = {
                    _type: 'OpExp' as const,
                    operator: newOp,
                    right,
                    left,
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
            let literalType = 'unimplemented';
            let literalValue: any = expressionContents[0].value.value;

            // This is where we lift literal tokens into values that the
            // runtime can understand.
            if (expressionContents[0].tokenType === 'numeric-literal') {
                literalType = 'number';
                literalValue = parseInt(literalValue);
            }
            expressionStack.push({
                _type: 'Literal',
                literalValue,
                literalType: literalType as any,
            });
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
                    let right = expressionStack.pop()!;
                    let left = expressionStack.pop()!;
                    expressionStack.push({
                        _type: 'OpExp' as const,
                        operator,
                        left,
                        right,
                    });
                }
                // This discards the opening parenthesis in the op stack.
                operatorStack.pop();
            }
            // Now we have handled both parens cases and we can shift the input to the next token.
            expressionContents.shift();
        } else if (expressionContents[0].value.value === 'if') {
            // consume the stuff in between "if" and "then" and parse an expression out of it
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
            );
            if (isLeft(thenBranchResult)) {
                return thenBranchResult;
            }

            let thenBranch = thenBranchResult.right.expression;

            expressionContents = result.right.input;

            result = consumeElseUntilEnd(expressionContents);
            if (isLeft(result)) {
                return result;
            }
            let elseBranch;
            if (expressionContents.length > 0 && expressionContents[0].tokenType === 'else') {
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
                );
                if (isLeft(elseBranchResult)) {
                    return elseBranchResult;
                }
                elseBranch = elseBranchResult.right.expression;
            } else {
                elseBranch = undefined;
            }
            expressionStack.push({
                condition,
                thenBranch,
                elseBranch,
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
        let right = expressionStack.pop()!;
        let left = expressionStack.pop()!;
        let operation = {
            _type: 'OpExp' as const,
            operator,
            right,
            left,
        };
        expressionStack.push(operation);
    }
    //    const expressionBuffer = result.right.expression;
    // Figure out what kind of expression this is and parse it accordingly
    // TODO
    if (expressionStack.length > 1) {
        console.warn(
            'There is an overflowed expressionStack. Perhaps something is wrong?',
            JSON.stringify(expressionStack, null, 2),
        );
    }

    return right({
        input: input,
        expression: expressionStack[0],
    });
}
