import { Either, right, left, isRight } from 'fp-ts/lib/Either';
import { Tokens } from './tokenizer';
import { FunctionDeclaration, functionDeclaration } from './function-declaration';
import { variableDeclaration, VariableDeclaration } from './variable-declaration';
import { Expression } from './expression/expression'

type Declaration = FunctionDeclaration | VariableDeclaration;
type Step = Expression | Declaration;
type Steps = Step[];


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
                console.log("new is: ", input.length);
                steps.push(parseResult.right.declaration);
                functionNamespace.push(parseResult.right.declaration);
            } else {
                return left(parseResult.left);
            }
        } else if (input[0].tokenType === 'type-keyword') {
            const parseResult = variableDeclaration(input, functionNamespace, variableNamespace);
            if (isRight(parseResult)) {
                input = parseResult.right.input;
                console.log('input length is ', input.length);
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
