import { Either, left, right } from 'fp-ts/lib/Either';
import { Operator, Expression } from './expression';
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

// TODO this would be a good spot to start enumerating the types and eliminating the 'string' stuff for returnTypes
const OpMapping: { [key in Operator['operatorType']]: { [key: string]: { [key: string]: string } } } = {
    '+': {
        number: {
            number: 'number',
        },
        note: {
            note: 'notes',
            notes: 'notes',
        },
    },
    '-': {
        number: {
            number: 'number',
        },
    },
    '*': {
        number: {
            number: 'number',
        },
    },
    '/': {
        number: {
            number: 'number',
        },
    },
    '%': {
        number: {
            number: 'number',
        },
    },
    // This isn't a 'true' operator so we shouldn't have anything in here.
    '(': {
        number: {},
    },
};
/**
 * This is used to define the return types of every op. This must match with
 * what is in the runtime, or else this compile-time type check won't match the actual runtime.
 */
export function opReturnTypeMap(lhs: string, rhs: string, op: Operator['operatorType']): Either<string, string> {
    let returnType = OpMapping[op][lhs][rhs];
    if (returnType === undefined) {
        return left(`Operator ${op} is not implemented for type "${lhs}" and "${rhs}"`);
    }
    return right(returnType);
}
