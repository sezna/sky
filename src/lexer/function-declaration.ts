import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { Tokens, Token } from './tokenizer';
import { ParseError, Steps, makeFunctionBodySyntaxTree } from './parser';
import { VariableDeclaration } from './variable-declaration';

export interface FunctionDeclaration {
    _type: 'FunctionDeclaration';
    functionName: Token;
    parameters: { varName: Token; varType: Token }[];
    body: Steps;
    returnType: Token;
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
    // getting the function name
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
    // matching the args
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
            reason: `Unexpected end of input after function keyword ('fn')`,
        });
    }
    // Get the argument list out of the function signature
    prevToken = token;
    token = input.shift()!;
    let parameters: { varName: Token; varType: Token }[] = [];
    while (token.value.value !== ')') {
        if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: `Unexpected end of input in function "${functionName}" declaration after open parenthesis `,
            });
        }
        // name for first arg
        const argName = token;
        prevToken = token;
        token = input.shift()!;
        // colon for first var
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
                reason: `Unexpected end of input in function parameters declaration for function "${functionName}". Expected a colon (':') and type name after parameter "${argName.value.value}".`,
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
                reason: `Unexpected end of input in function declaration for function "${functionName}" after colon (':'). Expected a type name for parameter "${argName.value.value}".`,
            });
        }
        const typeName = token!;
        parameters.push({ varName: argName, varType: typeName });

        // If this is not the last argument, then there should be a comma here.
        // since we don't know if this is the last one, we will instead just make
        // commas optional in this position and throw them away.
        if (input[0].tokenType === 'comma') {
            input.shift();
        }

        prevToken = token;
        token = input.shift()!;
    }
    // get the return type of the function
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
            reason: `Unexpected end of input in function declaration for function "${functionName}" after colon (':'). Expected a type name.`,
        });
    }

    // return type itself
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
            reason: `Unexpected end of input in function declaration for function "${functionName}." Expected a body enclosed in curly brackets.`,
        });
    }

    // opening the function body
    let bodyTokens: Tokens = [];
    let openingBraceCount = 1;
    let closingBraceCount = 0;
    while (closingBraceCount < openingBraceCount) {
        bodyTokens.push(token!);
        prevToken = token;
        token = input.shift()!;
        if (token.value.value === '}') {
            closingBraceCount += 1;
        } else if (token.value.value === '{') {
            openingBraceCount += 1;
        } else if (token === undefined) {
            return left({
                line: prevToken.value.line,
                column: prevToken.value.column,
                reason: `Missing closing curly bracket ('}') in function body for function "${functionName}".`,
            });
        }
    }

    // Inject the function params into the variable namespace
    let bodyResult = makeFunctionBodySyntaxTree(
        bodyTokens,
        functionNamespace,
        variableNamespace,
        parameters,
        functionNameToken,
        returnType,
    );
    if (isLeft(bodyResult)) {
        return bodyResult;
    }
    let body = bodyResult.right;

    // Find the return statement in the function body
    let stepReturnType, hasReturn;
    for (const step of body) {
        hasReturn = false;
        if (step._type === 'Return') {
            hasReturn = true;
            stepReturnType = step.returnExpr.returnType;
        }
    }
    if (!hasReturn) {
        return left({
            line: functionNameToken.value.line,
            column: functionNameToken.value.column,
            reason: `Function "${functionName}" does not return anything. Every function must return something, and this function should return something of type "${returnType.value.value}".`,
        });
    }

    if (stepReturnType !== returnType.value.value) {
        return left({
            line: functionNameToken.value.line,
            column: functionNameToken.value.column,
            reason: `Function "${functionNameToken.value.value}" is declared to return type "${returnType.value.value}" but actually returns type "${stepReturnType}".`,
        });
    }

    return right({
        input,
        declaration: {
            _type: 'FunctionDeclaration',
            functionName: functionNameToken,
            parameters,
            body,
            returnType,
        },
    });
}
