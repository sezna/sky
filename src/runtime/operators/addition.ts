import { EvalResult, RuntimeError } from '../';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
// Handle the + operator
export function addition(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, OperationSuccess> {
    console.log('adding ' + JSON.stringify(lhs, null, 2), JSON.stringify(rhs, null, 2));
    if (lhs.returnType !== rhs.returnType) {
        return left({
            line: 0, // TODO
            column: 0, // TODO
            reason: `Unable to add two different types: ${lhs.returnType} and ${rhs.returnType}`,
        });
    }

    // Now we know they are the same so we can just check one side.
    if (lhs.returnType === 'number') {
        return right({ valueType: 'number', value: lhs.returnValue + rhs.returnValue });
    }

    return left({
        line: 0,
        column: 0,
        reason: 'Unable to add anything yet',
    });
}
