import { EvalResult, RuntimeError } from '../';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
// Handle the + operator
export function addition(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, OperationSuccess> {
    if (lhs.returnType === 'number' && rhs.returnType === 'number') {
        return right({ valueType: 'number', value: lhs.returnValue + rhs.returnValue });
    }
    if (lhs.returnType === 'degree' && rhs.returnType === 'degree') {
        return right({ valueType: 'degree', value: lhs.returnValue + rhs.returnValue });
    }
    if (lhs.returnType === 'pitch' && rhs.returnType === 'pitch') {
        return right({ valueType: 'notes', value: [lhs.returnValue, rhs.returnValue] });
    }
    if (lhs.returnType === 'notes' && rhs.returnType === 'pitch') {
        return right({ valueType: 'notes', value: lhs.returnValue.concat(rhs.returnValue) });
    }
    if (lhs.returnType === 'pitch' && rhs.returnType === 'notes') {
        return right({ valueType: 'notes', value: [lhs.returnValue, ...rhs.returnValue] });
    }
    return left({
        line: 0,
        column: 0,
        reason: `Addition unimplemented for type ${lhs.returnType}`,
    });
}
