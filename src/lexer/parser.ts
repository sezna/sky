import { Either, right, left, isRight } from 'fp-ts/lib/Either';
import { Tokens, Token } from './tokenizer';
import { FunctionDeclaration, functionDeclaration } from './function-declaration';
type Expression = IfExp | VarExp | OpExp | Literal;

type Declaration = FunctionDeclaration | VariableDeclaration;
type Step = Expression | Declaration;
type Steps = Step[];

interface VariableDeclaration {
    varName: Token;
    varBody: Expression;
}

interface IfExp {
    condition: Expression;
    thenBranch: Expression;
    elseBranch: Expression;
}

interface VarExp {
    varName: string;
}

interface OpExp {
    left: Expression;
    right: Expression;
    operator: Operator;
}

interface Literal {
    literalType: 'degree' | 'note' | 'chord'; // TODO
    literalValue: string;
}

export interface ParseError {
    line: number;
    column: number;
    reason: string;
}

type Operator = '+' | '-'; // TODO
// TODO split this out into an eval and a metadata-wrapping function
// TODO return option of compileError or SyntaxTree -- have compileError bubble up
export function makeSyntaxTree(input: Tokens): Either<ParseError, Steps> {
    let steps: Steps = [];
                console.log("parsing succeeded, old input len is: ", input.length)
    while (input.length > 0) {
        if (input[0].tokenType === 'function-declaration') {
            const parseResult = functionDeclaration(input);
            if (isRight(parseResult)) {
                // Then it wasn't an error.
                input = parseResult.right.input;
                console.log("new is: ", input.length);
                steps.push(parseResult.right.declaration);
            } else {
                return left(parseResult.left);
            }
        }
    }
    return right(steps);
}
