import { Token } from '../tokenizer';
/// This file contains utils used by the expression parser.
/// The definition of the order of operations.
/// The higher the number, the higher the precedence of the operation.
export const precedence = (input: string) => {
    switch (input) {
        case '-':
        case '+':
            return 1;
        case '/':
        case '*':
        case '%':
            return 2;
        default:
            return 0;
    }
};

/// A utility function to determine if a token is a literal.
export function isLiteral(input: Token): boolean {
    return ['boolean-literal', 'scale-degree-literal', 'numeric-literal'].includes(input.tokenType);
}
