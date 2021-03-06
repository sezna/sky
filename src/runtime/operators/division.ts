import { RuntimeError } from '../';
import { EvalResult } from '../evaluate';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
/// Handle the / operator
export function division(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, OperationSuccess> {
    if (lhs.returnType !== rhs.returnType) {
        return left({
            line: 0, // TODO
            column: 0, // TODO
            reason: `Unable to divide two different types: ${lhs.returnType} and ${rhs.returnType}`,
        });
    }

    // Now we know they are the same so we can just check one side.
    if (lhs.returnType === 'number') {
        return right({ valueType: 'number', value: lhs.returnValue / rhs.returnValue });
    }

    return left({
        line: 0,
        column: 0,
        reason: `Division unimplemented for type ${lhs.returnType}`,
    });
}
