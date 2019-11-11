import { ParseError } from '../../parser';
import { Tokens, Token } from '../../tokenizer';
import { isLeft, Either, left, right } from 'fp-ts/lib/Either';
import { VariableDeclaration } from '../../variable-declaration';
import { FunctionDeclaration } from '../../function-declaration';
import { consumeExpression, consumeIfUntilThen, consumeThenUntilElse, consumeElseUntilEnd } from '../consumers';
import { isLiteral, precedence } from '../utils';
import { Expression } from '../expression-types';
import { parseFuncAppExpOrVarExp } from './parse-func-app-exp-or-var-exp';

export interface Operator {
    operatorType: '+' | '-' | '/' | '%' | '(';
    value: Token;
}

// a lot of this function was inspired by this page
//     https://www.geeksforgeeks.org/expression-evaluation/
/**
 * This is the part of the parser which, given a stream of tokens that begins with an expression, consumes that expression and lifts it into an expression type. It also returns the remaining input tokens left after consuming the expression.
 */
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
        if (expressionContents[0].tokenType === 'name') {
            let result = parseFuncAppExpOrVarExp(expressionContents, functionNamespace, variableNamespace);
            if (isLeft(result)) {
                return result;
            }
            expressionStack.push(result.right.expression);
            expressionContents = result.right.remainingExpressionContents;
            // If the token is some sort of identifier, it should be in either the function of variable namespace.
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
                _type: 'LiteralExp',
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
                _type: 'IfExp',
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
