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
