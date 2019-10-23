import { Either, right, left } from 'fp-ts/lib/Either';
import { Tokens, Token } from './tokenizer';
import { ParseError } from './parser';
import { VariableDeclaration } from './variable-declaration';

export interface FunctionDeclaration {
    functionName: Token;
    args: [Token, Token][];
    body: Token[];
    returnType: Token; // type-name
}

/// Takes in the entire input stream of tokens and either consumes enough for the function declaration, including its body, or fails and returns a parse error. On success, it returns the remaining input token stream and the parsed function declaration.
export function functionDeclaration(
    input: Tokens,
    functionNamespace: FunctionDeclaration[],
    variableNamespace: VariableDeclaration[],
): Either<ParseError, { input: Tokens; declaration: FunctionDeclaration }> {
    // Then we expect to see:
    // function-decl, name, parens, name, ascription token, type-keyword, etc, parens, ascription token, type-keyword, curly-bracket
    let token = input.shift()!; // 'fn'
    const functionNameToken = input.shift()!;
    const functionName = functionNameToken.value.value;
    const conflictingFunctionNames = functionNamespace.filter(x => x.functionName.value.value === functionName);
    if (conflictingFunctionNames.length > 0) {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Function ${functionName} has already been declared at line ${conflictingFunctionNames[0].functionName.value.line}, column ${conflictingFunctionNames[0].functionName.value.column}`,
        });
    }
    const conflictingVariableNames = variableNamespace.filter(x => x.varName.value.value === functionName);
    if (conflictingVariableNames.length > 0) {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Function "${functionName}"'s name conflicts with variable of the same name declared at line ${conflictingVariableNames[0].varName.value.line}, column ${conflictingVariableNames[0].varName.value.column}`,
        });
    }
    let prevToken = token;
    token = input.shift()!;
    if (token && token!.value.value !== '(') {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Malformed function declaration at line ${token.value.line}, column ${token.value.column}. Expected '(' but received '${token.value.value}.`,
        });
    }
    if (token === undefined) {
        return left({
            line: prevToken.value.line,
            column: prevToken.value.column,
            reason: `Unexpected EOF after function keyword ('fn')`,
        });
    }
    // Get the argument list out of the function signature
    prevToken = token;
    token = input.shift()!;
    let args: [Token, Token][] = [];
    while (token!.tokenType !== 'parens') {
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: `Unexpected EOF in function "${functionName}" declaration after open parenthesis `,
            });
        }
        const argName = token;
        prevToken = token;
        token = input.shift()!;
        if (token && token.tokenType !== 'type-ascription') {
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: `Malformed function declaration, missing type information in function "${functionName}". Expected ':' but received '${token.value.value}'. Example:
                          fn ${functionName}(${argName.value.value}:<TYPE_IDENTIFIER>):<RETURN_TYPE_IDENTIFIER> { function body }`,
            });
        }
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: `Unexpected EOF in function parameters declaration for function "${functionName}". Expected a colon (':') and type name after parameter "${argName.value.value}".`,
            });
        }
        prevToken = token;
        token = input.shift()!; // should be the type name
        if (token && token.tokenType !== 'type-keyword') {
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: `Invalid typename in function declaration for function "${functionName}". Expected a type name for parameter "${argName.value.value}" but received "${token.value.value}".`,
            });
        }
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: `Unexpected EOF in function declaration for function "${functionName}" after colon (':'). Expected a type name for parameter "${argName.value.value}".`,
            });
        }
        const typeName = token!;
        args.push([argName, typeName]);

        prevToken = token;
        token = input.shift()!;
    }
    prevToken = token;
    token = input.shift()!;
    if (token && token.tokenType !== 'type-ascription') {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Malformed function declaration, missing type information in function "${functionName}" after the declaration for the parameters of function.`,
        });
    }
    if (token === undefined) {
        return left({
            line: prevToken.value.line,
            column: prevToken.value.column,
            reason: `Unexpected EOF in function declaration for function "${functionName}" after colon (':'). Expected a type name.`,
        });
    }

    prevToken = token;
    token = input.shift()!;
    if (token && token.tokenType !== 'type-keyword') {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Missing return type on function "${functionName}." Received "${token.value.value}" but expected a type name`,
        });
    }
    const returnType = token!;
    prevToken = token;
    token = input.shift()!;
    if (token!.value.value !== '{') {
        return left({
            line: token.value.line,
            column: token.value.column,
            reason: `Invalid function body in function "${functionName}." Received ${
                token!.value.value
            } but expected an opening curly bracket ('{').`,
        });
    }
    if (token === undefined) {
        return left({
            line: prevToken.value.line,
            column: prevToken.value.column,
            reason: `Unexpected EOF in function declaration for function "${functionName}." Expected a body enclosed in curly brackets.`,
        });
    }
    let body: Tokens = [];
    while (token!.value.value !== '}') {
        body.push(token!);
        prevToken = token;
        token = input.shift()!;
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: `Missing closing curly bracket ('}') in function body for function "${functionName}".`,
            });
        }
    }
    console.log('parsed function declaration: ', functionName, args, body);
    return right({
        input,
        declaration: {
            functionName: functionNameToken,
            args,
            body,
            returnType,
        },
    });
}
