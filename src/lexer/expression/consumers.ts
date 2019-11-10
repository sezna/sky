import { ParseError } from '../parser';
import { Tokens } from '../tokenizer';
import { Either, left, right } from 'fp-ts/lib/Either';
/// Consume input tokens that begin with an expression until the end of that expression.
/// If successful, returns the remaining input with the expression removed.
export function consumeExpression(input: Tokens): Either<ParseError, { input: Tokens; tokens: Tokens }> {
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
    if (token.value.value === '{') {
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
    // If there is nothing enclosing the current expression, then we consume until a semicolon or a "then" indicating that this is within an if expression
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
    if (expressionBuffer.filter(x => !['(', ')', '{', '}', ';', 'then'].includes(x.value.value)).length === 0) {
        return left({
            line: exprBeginningPosition.value.line,
            column: exprBeginningPosition.value.column,
            reason: `Attempted to parse an empty expression`,
        });
    }
    return right({
        input: input,
        tokens: expressionBuffer,
    });
}

/// A special consumer to consume only what is between an "if" and a "then"
export function consumeIfUntilThen(input: Tokens): Either<ParseError, { input: Tokens; tokens: Tokens }> {
    // remove the initial "if"
    let initialToken = input.shift();
    if (initialToken === undefined) {
        return left({
            line: 0,
            column: 0,
            reason:
                'Attempted to consume if contents on an empty expression. This is an error within the compiler , please file a bug at https://github.com/sezna/sky and include the code that triggered it',
        });
    }
    if (initialToken.tokenType !== 'if') {
        return left({
            line: initialToken.value.line,
            column: initialToken.value.column,
            reason:
                'Attempted to consume if contents on a non-if expression. This is an error within the compiler , please file a bug at https://github.com/sezna/sky and include the code that triggered it',
        });
    }
    // Continue adding to the buffer until a "then" occurs. If an "if" occurs, allow a corresponding "then" to also occur.
    let ifCount = 1;
    let thenCount = 0;
    let expressionBuffer = [];
    let prevToken = initialToken;
    let token = input.shift()!;
    while (thenCount < ifCount) {
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: 'Unexpected EOF while parsing if expression',
            });
        }
        if (token.tokenType === 'if') {
            ifCount += 1;
        }
        expressionBuffer.push(token);
        prevToken = token;
        token = input.shift()!;
        if (token.tokenType === 'then') {
            thenCount += 1;
        }
    }
    // re-attach "then" back onto the front
    if (token.tokenType !== 'then') {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason:
                'Invalid parsing of if-then. This is a bug in the compiler. Please file an issue at https://github.com/sezna/sky with the code that triggered this error.',
        });
    }

    input.unshift(token!);
    return right({ input, tokens: expressionBuffer });
}

export function consumeThenUntilElse(input: Tokens): Either<ParseError, { input: Tokens; tokens: Tokens }> {
    let initialToken = input.shift();
    if (initialToken === undefined) {
        return left({
            line: 0,
            column: 0,
            reason:
                'Attempted to consume then contents on an empty expression. This is an error within the compiler , please file a bug at https://github.com/sezna/sky and include the code that triggered it',
        });
    }
    if (initialToken.tokenType !== 'then') {
        return left({
            line: initialToken.value.line,
            column: initialToken.value.column,
            reason:
                'Attempted to consume then contents on a non-then part of an expression. This is an error within the compiler , please file a bug at https://github.com/sezna/sky and include the code that triggered it',
        });
    }

    // If there is an "outer" else, then we stop.
    // If there is an "outer" semicolon, then we stop.
    // In order to know if something is outer, we have to keep track of all brackets at all times.
    let openParensCount = 0;
    let closeParensCount = 0;
    let openCurlyBraceCount = 0;
    let closeCurlyBraceCount = 0;
    let outerTerminatorSeen = false;
    let prevToken = initialToken;
    let token = input.shift()!;
    let expressionBuffer = [];
    let ifCount = 0;
    while (!outerTerminatorSeen) {
        expressionBuffer.push(token);
        prevToken = token;
        token = input.shift()!;
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: 'Unexpected EOF while parsing "then" expression',
            });
        }
        if (token.value.value === '(') {
            openParensCount += 1;
        } else if (token.value.value === ')') {
            closeParensCount += 1;
        } else if (token.value.value === '{') {
            openCurlyBraceCount += 1;
        } else if (token.value.value === '}') {
            closeCurlyBraceCount += 1;
        } else if (token.tokenType === 'else') {
            ifCount -= 1;
        } else if (token.tokenType === 'if') {
            ifCount += 1;
        }
        if (
            ['else', ';'].includes(token.value.value) &&
            closeParensCount === openParensCount &&
            closeCurlyBraceCount === openCurlyBraceCount &&
            ifCount <= 0
        ) {
            outerTerminatorSeen = true;
        }

        if (closeParensCount > openParensCount) {
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: 'Unmatched closing parenthesis',
            });
        }
        if (closeCurlyBraceCount > openCurlyBraceCount) {
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: 'Unmatched closing brace',
            });
        }
    }

    if (!['else', 'statement-terminator'].includes(token.tokenType)) {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Failed to parse then branch on character "${token.value.value}" (${token.tokenType}). This is bug in the compiler, please file an issue at https://github.com/sezna/sky with the code that triggered this error. `,
        });
    }

    input.unshift(token);
    return right({
        input,
        tokens: expressionBuffer,
    });
}

export function consumeElseUntilEnd(input: Tokens): Either<ParseError, { input: Tokens; tokens: Tokens }> {
    let initialToken = input.shift();
    if (initialToken === undefined) {
        return left({
            line: 0,
            column: 0,
            reason:
                'Attempted to consume else contents on an empty expression. This is an error within the compiler , please file a bug at https://github.com/sezna/sky and include the code that triggered it',
        });
    }
    if (initialToken.tokenType !== 'else') {
        return left({
            line: initialToken.value.line,
            column: initialToken.value.column,
            reason:
                'Attempted to consume if contents on a non-if expression. This is an error within the compiler , please file a bug at https://github.com/sezna/sky and include the code that triggered it',
        });
    }
    // If there is an "outer" semicolon, then we stop.
    // If the expression started with a curly bracket or a parenthesis, then we consume until that bracket is matched.
    // If the expression ends, then we stop.
    // In order to know if something is outer, we have to keep track of all brackets at all times.
    let openParensCount = 0;
    let closeParensCount = 0;
    let openCurlyBraceCount = 0;
    let closeCurlyBraceCount = 0;
    let outerTerminatorSeen = false;
    let prevToken = initialToken;
    let token = input.shift()!;
    let expressionBuffer = [];
    let ifCount = 0;
    if (token.value.value === '{') {
        openCurlyBraceCount += 1;
    }
    while ((!outerTerminatorSeen || closeCurlyBraceCount !== openCurlyBraceCount) && input.length > 0) {
        expressionBuffer.push(token);
        prevToken = token;
        token = input.shift()!;
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: 'Unexpected EOF while parsing "else" branch of an if  expression',
            });
        }
        if (token.value.value === '(') {
            openParensCount += 1;
        } else if (token.value.value === ')') {
            closeParensCount += 1;
            if (closeParensCount > openParensCount) {
                break;
            }
        } else if (token.value.value === '{') {
            openCurlyBraceCount += 1;
        } else if (token.value.value === '}') {
            closeCurlyBraceCount += 1;
        } else if (token.tokenType === 'else') {
            ifCount -= 1;
        } else if (token.tokenType === 'if') {
            ifCount += 1;
        }
        if (
            [';'].includes(token.value.value) &&
            closeParensCount === openParensCount &&
            closeCurlyBraceCount === openCurlyBraceCount &&
            ifCount <= 0
        ) {
            outerTerminatorSeen = true;
        }

        if (closeParensCount > openParensCount) {
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: 'Unmatched closing parenthesis',
            });
        }
        if (closeCurlyBraceCount > openCurlyBraceCount) {
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: 'Unmatched closing brace',
            });
        }
    }
    return right({ input, tokens: expressionBuffer });
}
