import { RuntimeError } from '../';
import { EvalResult } from '../evaluate';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
/// Handle the * operator
export function multiplication(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, OperationSuccess> {
    // Now we know they are the same so we can just check one side.
    if (lhs.returnType === 'number' && rhs.returnType === 'number') {
        return right({ valueType: 'number', value: lhs.returnValue * rhs.returnValue });
    } else if (lhs.returnType === 'pitch_rhythm' && rhs.returnType === 'number') {
        let value = [];
        for (let i = 0; i < rhs.returnValue; i++) {
            value.push(lhs);
        }
        return right({
            valueType: 'list pitch_rhythm',
            value,
        });
    } else if (lhs.returnType === 'number' && rhs.returnType === 'pitch_rhythm') {
        let value = [];
        for (let i = 0; i < lhs.returnValue; i++) {
            value.push(rhs);
        }
        return right({
            valueType: 'list pitch_rhythm',
            value,
        });
    }

    return left({
        line: 0,
        column: 0,
        reason: `Multiplication unimplemented for type ${lhs.returnType} and ${rhs.returnType}`,
    });
}
