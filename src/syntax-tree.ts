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
            let token = input.shift(); // 'fn'
            const functionName = input.shift()!;
            token = input.shift();
            if (token && token!.value.value !== '(') {
                console.error(
                    `Malformed function declaration at line ${token.value.line}, column ${token.value.column}`,
                );
                return {} as any; // TODO error handling
            }
            // Get the argument list out of the function signature
            token = input.shift();
            let args: [Token, Token][] = [];
            while (token!.tokenType !== 'parens') {
                if (token === undefined) {
                    console.error(`Received EOF in function declaration`);
                    return {} as any; // TODO error handling
                }
                const argName = token;
                token = input.shift();
                if (token && token.tokenType !== 'type-ascription') {
                    console.error(
                        `Malformed function declaration, missing type information at line ${token.value.line}, column ${token.value.column}`,
                    );
                }
                token = input.shift(); // should be the type name
                if (token && token.tokenType !== 'type-keyword') {
                    console.error(`Invalid typename at line ${token.value.line}, column ${token.value.column}`);
                    return {} as any;
                }
                const typeName = token!;
                args.push([argName, typeName]);

                token = input.shift();
            }
            token = input.shift();
            if (token && token.tokenType !== 'type-ascription') {
                console.error(
                    `Malformed function declaration, missing type information at line ${token.value.line}, column ${token.value.column}`,
                );
            }
            token = input.shift();
            if (token && token.tokenType !== 'type-keyword') {
                console.error(
                    `Missing return type on function ${functionName} at line ${token.value.line}, column ${token.value.column}. Received ${token.value.value} but expected a type name`,
                );
            }
            const returnType = token!;
            token = input.shift();
            if (token!.value.value !== '{') {
                console.error(
                    `Invalid function body at line ${token!.value.line}, column ${token!.value.column}. Received ${
                        token!.value.value
                    } but expected '{'`,
                );
            }
            let body: Tokens = [];
            while (token!.value.value !== '}') {
                body.push(token!);
                token = input.shift();
            }
            console.log('parsed function declaration: ', functionName, args, body);
            steps.push({
                functionName,
                args,
                body,
                returnType,
            });
        }
        break;
    }
    return steps;
}
