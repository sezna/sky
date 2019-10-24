import { ParseError } from '../parser';
import { Tokens } from '../tokenizer';
import { isLeft, Either, left, right } from 'fp-ts/lib/Either';
export type Expression = IfExp | VarExp | OpExp | Literal;
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

type Operator = '+' | '-'; // TODO
interface Literal {
    literalType: 'degree' | 'note' | 'chord'; // TODO
    literalValue: string;
}

/// If input is a valid expression, determine what type of expression it is and parse
/// it into an elevated type of that expression. Otherwise, return a ParseError.
export function parseExpression(input: Tokens): Either<ParseError, { input: Tokens; declaration: Expression }> {
    // Extract the expression out of the beginning of the input.
    const result = consumeExpression(input);
    if (isLeft(result)) {
        return result;
    }

    input = result.right.input;
//    const expressionBuffer = result.right.expression;
    // Figure out what kind of expression this is and parse it accordingly
    // TODO

    return right({
        input: input,
        declaration: {
            varName: 'TODO -- unimplemented',
        },
    });
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
        reason: "Attempted to parse an expression that didn't exist. This is an error with the compiler. Please file an issue at https://github.com/sezna/sky and include the code that caused this error."
      })
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
    if (expressionBuffer.filter(x => !["(", ")", "{", "}", ";"].includes(x.value.value)).length === 0) {
      return left({
        line: exprBeginningPosition.value.line,
        column: exprBeginningPosition.value.column,
        reason: `Attempted to parse an empty expression`
      })
    }

    return right({
        input: input,
        expression: expressionBuffer,
    });
}
