import { Either, right, left, isRight, isLeft } from 'fp-ts/lib/Either';
import { Token, Tokens } from './tokenizer';
import { FunctionDeclaration, functionDeclaration } from './function-declaration';
import { variableDeclaration, VariableDeclaration } from './variable-declaration';
import { Expression, parseExpression } from './expression/expression';

type Declaration = FunctionDeclaration | VariableDeclaration | Reassignment;
export type Step = Expression | Declaration | Return;
export type Steps = Step[];

export interface Return {
    _type: 'Return';
    returnExpr: Expression;
}

export interface Reassignment {
    _type: 'Reassignment';
    name: Token;
    newVarBody: Expression;
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
                return left(parseResult.left);
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
            if (returnExpr.returnType !== returnType.value.value) {
                return left({
                    line: returnKeyword.value.line,
                    column: returnKeyword.value.column,
                    reason: `Function "${functionNameToken.value.value}" is declared to return type "${returnType.value.value}" but actually returns type "${returnExpr.returnType}"`,
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
                let varName = input.shift()!;
                let reassignResult = reassignVariable(varName, input, functionNamespace, variableNamespace);
                if (isLeft(reassignResult)) {
                    return reassignResult;
                }
                let reassignment = reassignResult.right;
                input = reassignment.input;
                steps.push(reassignment.reassignment);
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

/**
 * Given a name and a new value, reassigns a variable within a namespace. (TODO should ensure the variable is of the same type as before.)
 */
function reassignVariable(
    name: Token,
    input: Tokens,
    functionNamespace: FunctionDeclaration[],
    variableNamespace: VariableDeclaration[],
): Either<ParseError, { input: Tokens; reassignment: Reassignment }> {
    let matches = variableNamespace.filter(x => x.varName.value.value === name.value.value);
    if (matches.length > 1) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `Multiple matching variable names in namespace for name ${name.value.value}. This should never happen and is an error in the compiler. Please file an issue at https://github.com/sezna/sky and include the code that triggered this error.`,
        });
    }
    if (matches.length == 0) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `No matching variable names in namespace for ${name.value.value}. This should never happen and is an error in the compiler. Please file an issue at https://github.com/sezna/sky and include the code that triggered this error.`,
        });
    }

    let equalsToken = input.shift()!;
    if (equalsToken === undefined) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `Expected equals sign in reassignment but instead found the end of a token stream.`,
        });
    }
    if (equalsToken.tokenType !== 'assignment-operator') {
        return left({
            line: equalsToken.value.line,
            column: equalsToken.value.column,
            reason: `Expected equals sign in reassignment but instead found "${equalsToken.value.value}" (${equalsToken.tokenType}).`,
        });
    }

    let newVarBodyResult = parseExpression(input, functionNamespace, variableNamespace);

    if (isLeft(newVarBodyResult)) {
        return newVarBodyResult;
    }

    let newVarBody = newVarBodyResult.right;

    if (matches[0].varType.value.value !== newVarBody.expression.returnType) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `Attempted to assign value of type "${newVarBody.expression.returnType}" to variable "${matches[0].varName.value.value}", which has type "${matches[0].varType.value.value}".`,
        });
    }

    matches[0].varBody = newVarBody.expression;

    return right({
        input: newVarBody.input,
        reassignment: {
            _type: 'Reassignment' as const,
            name,
            newVarBody: newVarBody.expression,
        },
    });
}
