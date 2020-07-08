import { Either, right, left, isRight, isLeft } from 'fp-ts/lib/Either';
import { Token, Tokens } from './tokenizer';
import { FunctionDeclaration, functionDeclaration } from './function-declaration';
import { variableDeclaration, VariableDeclaration } from './variable-declaration';
import { Expression, parseExpression } from './expression/expression';
import { reassignVariable, Reassignment } from './reassign-variable';
import { propertyAssignment, PropertyAssignment } from './property-assignment';

type Declaration = FunctionDeclaration | VariableDeclaration | Reassignment | PropertyAssignment;
export type Step = Expression | Declaration | Return;
export type Steps = Step[];

export interface Return {
    _type: 'Return';
    returnExpr: Expression;
}

export interface ParseError {
    line: number;
    column: number;
    reason: string;
}
export function makeSyntaxTree(input: Tokens): Either<ParseError, Steps> {
    let functionNamespace: FunctionDeclaration[] = [];
    let variableNamespace: VariableDeclaration[] = [];
    let steps: Steps = [];
    while (input.length > 0) {
        if (input[0].tokenType === 'function-declaration') {
            const parseResult = functionDeclaration(input, functionNamespace, variableNamespace);
            if (isRight(parseResult)) {
                // Then it wasn't an error.
                input = parseResult.right.input;
                steps.push(parseResult.right.declaration);
                functionNamespace.push(parseResult.right.declaration);
            } else {
                return left(parseResult.left);
            }
        } else if (input[0].tokenType === 'type-keyword') {
            const parseResult = variableDeclaration(input, functionNamespace, variableNamespace);
            if (isRight(parseResult)) {
                input = parseResult.right.input;
                steps.push(parseResult.right.declaration);
                variableNamespace.push(parseResult.right.declaration);
            } else {
                return left(parseResult.left);
            }
        } else if (input[0].tokenType === 'statement-terminator') {
            input.shift();
        } else {
            return left({
                line: input[0].value.line,
                column: input[0].value.column,
                reason: `Attempted to do something that isn't a function declaration or variable declaration in the global scope. Token "${input[0].value.value}" is not allowed in this position.`,
            });
        }
    }
    return right(steps);
}

/**
 * Given tokens from a function body and an initial (typically the global) function/variable namespace, create a syntax tree.
 *
 * Programatically, this identifies if each expression is a declaration or an expression, and then calls the appropriate
 * declaration or expression parser. It assembles the results of all of these parsers into an array of steps.
 * The return type is used to validate the type correctness of any return statements.
 * `functionName` is just used for error messages
 */
export function makeFunctionBodySyntaxTree(
    input: Tokens,
    initialFunctionNamespace: FunctionDeclaration[],
    initialVariableNamespace: VariableDeclaration[],
    params: { varName: Token; varType: Token }[],
    functionNameToken: Token,
    returnType: Token,
): Either<ParseError, Steps> {
    let functionNamespace = [...initialFunctionNamespace];
    let variableNamespace = [...initialVariableNamespace];
    let steps: Steps = [];
    // A function body always starts and ends with braces `{` so we go ahead and pop that off.
    let leftBrace = input.shift()!;
    if (leftBrace === undefined) {
        return left({
            line: 0,
            column: 0,
            reason: `Unexpected EOF in function declaration. `, // TODO line number/function name
        });
    }
    if (leftBrace.value.value !== '{') {
        return left({
            line: leftBrace.value.line,
            column: leftBrace.value.column,
            reason: `Attempted to parse function body that didn't begin with a bracket ( "{" ). `,
        });
    }
    // We allow empty functions, so just return with no steps if this is empty.
    if (input.length === 0) {
        return right([]);
    }
    while (input.length > 0) {
        if (input[0].tokenType === 'type-keyword') {
            const parseResult = variableDeclaration(input, functionNamespace, variableNamespace);
            if (isRight(parseResult)) {
                input = parseResult.right.input;
                steps.push(parseResult.right.declaration);
                variableNamespace.push(parseResult.right.declaration);
            } else {
                return parseResult;
            }
        } else if (input[0].tokenType === 'return-keyword') {
            let returnKeyword = input.shift()!; // remove te word "return" itself
            if (input.length === 0) {
                return left({
                    line: returnKeyword.value.line,
                    column: returnKeyword.value.column,
                    reason: `Expected expression after "return" keyword but received end of input`,
                });
            }
            let returnExprResult = parseExpression(input, functionNamespace, variableNamespace, params);
            if (isLeft(returnExprResult)) {
                return returnExprResult;
            }
            let returnExpr = returnExprResult.right.expression;
          console.log(JSON.stringify(returnExpr, null, 2));
            if (returnExpr.returnType !== returnType.value.value) {
                return left({
                    line: returnKeyword.value.line,
                    column: returnKeyword.value.column,
                    reason: `Function "${functionNameToken.value.value}" is declared to return a value of type "${returnType.value.value}" but actually returns type "${returnExpr.returnType}"`,
                });
            }
            steps.push({
                _type: 'Return',
                returnExpr,
            });
        } else if (input[0].tokenType === 'name') {
            // Determine if this is a variable name, function name, or undeclared name.
            let matchingFunctions = functionNamespace.filter(x => x.functionName.value.value === input[0].value.value);
            let matchingVariables = variableNamespace.filter(x => x.varName.value.value === input[0].value.value);
            if (matchingFunctions.length > 0 && matchingVariables.length > 0) {
                return left({
                    line: input[0].value.line,
                    column: input[0].value.column,
                    reason: `Ambiguous reference to "${input[0].value.value}" which could be either a function or a variable.`,
                });
            }
            if (matchingFunctions.length === 0 && matchingVariables.length === 0) {
                return left({
                    line: input[0].value.line,
                    column: input[0].value.column,
                    reason: `Name "${input[0].value.value}" has not been defined.`,
                });
            }
            let typeOfName = matchingFunctions.length === 1 ? 'function' : 'variable';
            if (typeOfName === 'function') {
                let functionApplicationResult = parseExpression(input, functionNamespace, variableNamespace);
                if (isLeft(functionApplicationResult)) {
                    return functionApplicationResult;
                }
                let functionApplication = functionApplicationResult.right;
                input = functionApplication.input;
                steps.push(functionApplication.expression);
            } else {
                // This is a variable name, then, so this is a variable reassignment.
                // It could be of form `name[index][index][index] ( etc. ) .property`, or have no indexes. First, we consume any potential indexes.
                const varName = input.shift()!;
                // This is the list of indexing expressions, to be included in the evaluation of the variable later.
                // A quick typecheck to ensure that this is only happening on a list-type variable could help, but is currently
                // unimplemented.
                let indexExprs = [];
                while (input[0].value.value === '[' && input.length > 0) {
                    // Then some indexes exist after this name.
                    let openingBracket = input.shift()!;
                    let expBuffer = [];
                    // Consume until the corresponding closing bracket.
                    let bracketCount = 1;
                    while (bracketCount > 0 && input.length > 0) {
                        let currentToken = input.shift()!;
                        if (currentToken === undefined) {
                            return left({
                                line: openingBracket.value.line,
                                column: openingBracket.value.column,
                                reason: `Expected closing bracket "]" to terminate index of variable "${varName.value.value}".`,
                            });
                        }
                        if (currentToken.value.value === ']') {
                            bracketCount -= 1;
                            if (bracketCount === 0) {
                                break;
                            }
                        } else if (currentToken.value.value === '[') {
                            bracketCount += 1;
                        } else {
                            expBuffer.push(currentToken);
                        }
                    }
                    if (expBuffer.length === 0) {
                        return left({
                            line: openingBracket.value.line,
                            column: openingBracket.value.column,
                            reason: `Empty indexing expression for variable "${varName}".`,
                        });
                    }
                    expBuffer.push({
                        tokenType: 'statement-terminator' as const,
                        value: { line: openingBracket.value.line, column: openingBracket.value.column, value: ';' },
                    });
                    const indexExprRes = parseExpression(expBuffer, functionNamespace, variableNamespace);
                    if (isLeft(indexExprRes)) {
                        return indexExprRes;
                    }
                    const indexExpr = indexExprRes.right.expression;
                    indexExprs.push(indexExpr);
                }
                if ((input[0].tokenType as any) === 'property') {
                    let res = propertyAssignment(varName, input, indexExprs);
                    if (isLeft(res)) {
                        return res;
                    }
                    input = res.right.input;
                    steps.push(res.right.propertyAssignment);
                } else {
                    // If the next character is not an =, as it should be in a reassignment, `reassignResult` handles the error checking.
                    let reassignResult = reassignVariable(
                        varName,
                        input,
                        functionNamespace,
                        variableNamespace,
                        indexExprs,
                    );
                    if (isLeft(reassignResult)) {
                        return reassignResult;
                    }
                    let reassignment = reassignResult.right;
                    input = reassignment.input;
                    steps.push(reassignment.reassignment);
                }
            }
        } else {
            let expressionResult = parseExpression(input, functionNamespace, variableNamespace);
            if (isLeft(expressionResult)) {
                return expressionResult;
            }
            let expression = expressionResult.right;
            input = expression.input;
            steps.push(expression.expression);
        }
    }

    return right(steps);
}
