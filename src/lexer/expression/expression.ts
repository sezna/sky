import { ParseError } from '../parser';
import { Tokens, Token } from '../tokenizer';
import { isLeft, Either, left, right } from 'fp-ts/lib/Either';
import { VariableDeclaration } from '../variable-declaration';
import { FunctionDeclaration } from '../function-declaration';
export type Expression = IfExp | VarExp | OpExp | Literal | FunctionApplication;

interface IfExp {
    condition: Expression;
    thenBranch: Expression;
    elseBranch: Expression;
}

interface VarExp {
    varName: Token;
}

interface OpExp {
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

interface Literal {
    literalType: Token['tokenType'];
    literalValue: Token;
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

    let expressionContents = result.right.expression;

    let expressionStack: Expression[] = [];
    let operatorStack: Operator[] = [];

    // We continually take the first token in the expression and try to reduce it.
    while (expressionContents.length > 0) {
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
                expressionStack.push({ varName: expressionContents[0] });
                expressionContents.shift();
            } else if (matchingFunctions.length === 1) {
                console.log('looks like this is a function');
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
                    console.log('1');
                    let prevToken = rover;
                    rover = expressionContents.shift()!;
                    console.log('here, rover is', rover);
                    if (rover === undefined) {
                        console.log('args thus far: ', JSON.stringify(args));
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
                        console.log('pushing to args', result.right.expression);
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
            expressionStack.push({
                literalValue: expressionContents[0],
                literalType: expressionContents[0].tokenType,
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
                        operator,
                        left,
                        right,
                    });
                }
                // discard the left parens
            }
            expressionContents.shift();
        } else {
            // if expressions
            return left({
                line: expressionContents[0].value.line,
                column: expressionContents[0].value.column,
                reason: `Unimplemented feature: ${expressionContents[0].value.value} in this position is unimplemented`,
            });
        }
    }

    while (operatorStack.length > 1) {
        let operator = operatorStack.pop()!;
        let right = expressionStack.pop()!;
        let left = expressionStack.pop()!;
        let operation = {
            operator,
            right,
            left,
        };
        expressionStack.push(operation);
    }
    //    const expressionBuffer = result.right.expression;
    // Figure out what kind of expression this is and parse it accordingly
    // TODO

    return right({
        input: input,
        expression: {
            varName: {},
        } as any,
    });
}

/// A utility function to determine if a token is a literal.
function isLiteral(input: Token): boolean {
    return ['scale-degree-literal', 'numeric-literal'].includes(input.tokenType);
}

/// Consume input tokens that begin with an expression until the end of that expression.
/// If successful, returns the remaining input with the expression removed.
function consumeExpression(input: Tokens): Either<ParseError, { input: Tokens; expression: Tokens }> {
    // It is up to the compiler to only call `parseExpression` on valid expressions. If it is called on empty input, then something
    // has gone wrong elsewhere in the code.
    if (input.length === 0) {
        return left({
            line: 0,
            column: 0,
            reason:
                "Attempted to parse an expression that didn't exist. This is an error with the compiler. Please file an issue at https://github.com/sezna/sky and include the code that caused this error.",
        });
    }
    // Used for error messages later on
    const exprBeginningPosition = { ...input[0] };
    // Consume until the end of this expression and fill a buffer.
    let expressionBuffer: Tokens = [];
    let token = input.shift()!; // if `parseExpression` is called on an empty array of tokens,
    // we have other problems. See above for details.
    if (token.value.value === '(') {
        // If the expression is enclosed in parenthesis, consume until the end of the parenthesis.
        const openParens = token; // Keep track of where the opening parenthesis was for error reporting
        let openParensCount = 1;
        let closeParensCount = 0;
        while (openParensCount !== closeParensCount) {
            expressionBuffer.push(token);
            token = input.shift()!;
            if (token === undefined) {
                return left({
                    line: openParens.value.line,
                    column: openParens.value.column,
                    reason: 'Opening parenthesis is never closed.',
                });
            } else if (token.value.value === ')') {
                closeParensCount += 1;
            } else if (token.value.value === '(') {
                openParensCount += 1;
            }
        }
        expressionBuffer.push(token);
    } else if (token.value.value === '{') {
        // same as above, but for curly brackets
        const openCurlyBracket = token;
        let openCurlyBracketCount = 1;
        let closeCurlyBracketCount = 0;
        while (openCurlyBracketCount !== closeCurlyBracketCount) {
            expressionBuffer.push(token);
            token = input.shift()!;
            if (token === undefined) {
                return left({
                    line: openCurlyBracket.value.line,
                    column: openCurlyBracket.value.column,
                    reason: 'Opening parenthesis is never closed.',
                });
            } else if (token.value.value === '}') {
                closeCurlyBracketCount += 1;
            } else if (token.value.value === '{') {
                openCurlyBracketCount += 1;
            }
        }
        expressionBuffer.push(token);
    }
    // If there is nothing enclosing the current expression, then we consume until a semicolon.
    else {
        // keep track of this for a good error message
        let prevToken = token;
        while (token.tokenType !== 'statement-terminator') {
            expressionBuffer.push(token);
            token = input.shift()!;
            if (token === undefined) {
                return left({
                    line: prevToken.value.line,
                    column: prevToken.value.column,
                    reason: "Expression never terminated. Perhaps there's a missing semicolon here?",
                });
            }
        }
    }
    // If there is no actual content to the expression, i.e. it has only (), {}, or ;, then it is invalid.
    if (expressionBuffer.filter(x => !['(', ')', '{', '}', ';'].includes(x.value.value)).length === 0) {
        return left({
            line: exprBeginningPosition.value.line,
            column: exprBeginningPosition.value.column,
            reason: `Attempted to parse an empty expression`,
        });
    }
    return right({
        input: input,
        expression: expressionBuffer,
    });
}

/// The definition of the order of operations.
/// The higher the number, the higher the precedence of the operation.
const precedence = (input: string) => {
    switch (input) {
        case '-':
        case '+':
            return 1;
        case '/':
        case '*':
        case '%':
            return 2;
        default:
            return 0;
    }
};
