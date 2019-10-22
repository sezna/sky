import { Tokens, Token } from './tokenizer';
type Expression = IfExp | VarExp | OpExp | Literal;

type Declaration = FunctionDeclaration | VariableDeclaration;

interface FunctionDeclaration {
    functionName: Token;
    args: [Token, Token][];
    body: Token[];
    returnType: Token; // type-name
}

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

type ParseResult = Steps | ParseError;
interface ParseError {
    line: number;
    column: number;
    reason: string;
}

type Operator = '+' | '-'; // TODO
// TODO split this out into an eval and a metadata-wrapping function
// TODO return option of compileError or SyntaxTree -- have compileError bubble up
export function makeSyntaxTree(input: Tokens): ParseResult {
    let steps: Steps = [];
    while (input.length > 0) {
        if (input[0].tokenType === 'function-declaration') {
            // Then we expect to see:
            // function-decl, name, parens, name, ascription token, type-keyword, etc, parens, ascription token, type-keyword, curly-bracket
            let token = input.shift()!; // 'fn'
            const functionNameToken = input.shift()!;
            const functionName = functionNameToken.value.value;
            let prevToken = token;
            token = input.shift()!;
            if (token && token!.value.value !== '(') {
                return {
                    line: token.value.line,
                    column: token.value.column,
                    reason: `Malformed function declaration at line ${token.value.line}, column ${token.value.column}. Expected '(' but received '${token.value.value}.`,
                };
            }
            if (token === undefined) {
                return {
                    line: prevToken.value.line,
                    column: prevToken.value.column,
                    reason: `Unexpected EOF after function keyword ('fn')`,
                };
            }
            // Get the argument list out of the function signature
            prevToken = token;
            token = input.shift()!;
            let args: [Token, Token][] = [];
            while (token!.tokenType !== 'parens') {
                if (token === undefined) {
                    return {
                        line: prevToken.value.line,
                        column: prevToken.value.column,
                        reason: `Unexpected EOF in function "${functionName}" declaration after open parenthesis `,
                    };
                }
                const argName = token;
                prevToken = token;
                token = input.shift()!;
                if (token && token.tokenType !== 'type-ascription') {
                    return {
                        line: token.value.line,
                        column: token.value.column,
                        reason: `Malformed function declaration, missing type information in function "${functionName}". Expected ':' but received '${token.value.value}'. Example:
                          fn ${functionName}(${argName.value.value}:<TYPE_IDENTIFIER>):<RETURN_TYPE_IDENTIFIER> { function body }`,
                    };
                }
                if (token === undefined) {
                    return {
                        line: prevToken.value.line,
                        column: prevToken.value.column,
                        reason: `Unexpected EOF in function parameters declaration for function "${functionName}". Expected a colon (':') and type name after parameter "${argName.value.value}".`,
                    };
                }
                prevToken = token;
                token = input.shift()!; // should be the type name
                if (token && token.tokenType !== 'type-keyword') {
                    return {
                        line: token.value.line,
                        column: token.value.column,
                        reason: `Invalid typename in function declaration for function "${functionName}". Expected a type name for parameter "${argName.value.value}" but received "${token.value.value}".`,
                    };
                }
                if (token === undefined) {
                    return {
                        line: prevToken.value.line,
                        column: prevToken.value.column,
                        reason: `Unexpected EOF in function declaration for function "${functionName}" after colon (':'). Expected a type name for parameter "${argName.value.value}".`,
                    };
                }
                const typeName = token!;
                args.push([argName, typeName]);

                prevToken = token;
                token = input.shift()!;
            }
            prevToken = token;
            token = input.shift()!;
            if (token && token.tokenType !== 'type-ascription') {
                return {
                    line: prevToken.value.line,
                    column: prevToken.value.column,
                    reason: `Malformed function declaration, missing type information in function "${functionName}" after the declaration for the parameters of function.`,
                };
            }
            if (token === undefined) {
                return {
                    line: prevToken.value.line,
                    column: prevToken.value.column,
                    reason: `Unexpected EOF in function declaration for function "${functionName}" after colon (':'). Expected a type name.`,
                };
            }

            prevToken = token;
            token = input.shift()!;
            if (token && token.tokenType !== 'type-keyword') {
                console.error(
                    `Missing return type on function "${functionName}." Received "${token.value.value}" but expected a type name`,
                );
            }
            const returnType = token!;
            prevToken = token;
            token = input.shift()!;
            if (token!.value.value !== '{') {
                console.error(
                    `Invalid function body in function "${functionName}." Received ${
                        token!.value.value
                    } but expected an opening curly bracket ('{').`,
                );
            }
            if (token === undefined) {
                return {
                    line: prevToken.value.line,
                    column: prevToken.value.column,
                    reason: `Unexpected EOF in function declaration for function "${functionName}." Expected a body enclosed in curly brackets.`,
                };
            }
            let body: Tokens = [];
            while (token!.value.value !== '}') {
                body.push(token!);
                prevToken = token;
                token = input.shift()!;
                if (token === undefined) {
                    return {
                        line: prevToken.value.line,
                        column: prevToken.value.column,
                        reason: `Missing closing curly bracket ('}') in function body for function "${functionName}".`,
                    };
                }
            }
            console.log('parsed function declaration: ', functionName, args, body);
            steps.push({
                functionName: functionNameToken,
                args,
                body,
                returnType,
            });
        }
    }
    return steps;
}
