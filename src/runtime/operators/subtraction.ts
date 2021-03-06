import { RuntimeError } from '../';
import { EvalResult } from '../evaluate';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
/// Handle the - operator
export function subtraction(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, OperationSuccess> {
    if (lhs.returnType !== rhs.returnType) {
        return left({
            line: 0, // TODO
            column: 0, // TODO
            reason: `Unable to subtract two different types: ${lhs.returnType} and ${rhs.returnType}`,
        });
    }

    if (lhs.returnType === 'number' && rhs.returnType === 'number') {
        return right({ valueType: 'number', value: lhs.returnValue - rhs.returnValue });
    }
    if (lhs.returnType === 'degree' && rhs.returnType === 'degree') {
        return right({ valueType: 'degree', value: lhs.returnValue - rhs.returnValue });
    }

    return left({
        line: 0,
        column: 0,
        reason: `Subtraction unimplemented for type ${lhs.returnType}`,
    });
}
