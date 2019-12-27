import { RuntimeError } from '../';
import { EvalResult } from '../evaluate';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
// Handle the && operator
export function and(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, OperationSuccess> {
    if (lhs.returnType === 'boolean' && rhs.returnType === 'boolean') {
        return right({ valueType: 'boolean', value: lhs.returnValue && rhs.returnValue });
    }
    return left({
        line: 0,
        column: 0,
        reason: `Boolean and (&&) unimplemented for types "${lhs.returnType}" and "${rhs.returnType}"`,
    });
}
