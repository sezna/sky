import { RuntimeError } from '../';
import { EvalResult } from '../evaluate';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
// Handle the == operator.
export function equals(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, OperationSuccess> {
    if (lhs.returnType !== rhs.returnType) {
        return left({
            line: 0,
            column: 0,
            reason: `Boolean equals (==) unimplemented for types "${lhs.returnType}" and "${rhs.returnType}"`,
        });
    }
    return right({
        valueType: 'boolean',
        value: lhs.returnValue === rhs.returnValue,
    });
}
