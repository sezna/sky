import { Either, right, left, isRight } from 'fp-ts/lib/Either';
import { Tokens } from './tokenizer';
import { FunctionDeclaration, functionDeclaration } from './function-declaration';
import { variableDeclaration, VariableDeclaration } from './variable-declaration';
import { Expression } from './expression/expression';

type Declaration = FunctionDeclaration | VariableDeclaration;
export type Step = Expression | Declaration;
export type Steps = Step[];

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
 */
export function makeFunctionBodySyntaxTree(
    input: Tokens,
    initialFunctionNamespace: FunctionDeclaration[],
    initialVariableNamespace: VariableDeclaration[],
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
    // We don't disallow empty functions, so just return with no steps if this is empty.
    if (input.length === 0) {
        return right([]);
    }
    if (input[0].tokenType === 'type-keyword') {
        const parseResult = variableDeclaration(input, functionNamespace, variableNamespace);
        if (isRight(parseResult)) {
            input = parseResult.right.input;
            steps.push(parseResult.right.declaration);
            variableNamespace.push(parseResult.right.declaration);
        } else {
            return left(parseResult.left);
        }
    } else {
        return left({
            line: input[0].value.line,
            column: input[0].value.column,
            reason: `Attempted to do something unimplemented inside of a function body. Token "${input[0].value.value}" is not allowed in this position.`,
        });
    }

    return right(steps);
}
