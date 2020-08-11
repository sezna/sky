import { RuntimeError } from '../';
import { EvalResult } from '../evaluate';
import { Token } from '../../lexer/tokenizer';
import { Either, right, left } from 'fp-ts/lib/Either';
import { OperationSuccess } from './operation-success';
// Handle the + operator
export function addition(
    lhs: EvalResult,
    rhs: EvalResult,
    operatorToken: Token,
): Either<RuntimeError, OperationSuccess> {
    if (lhs.returnType === 'number' && rhs.returnType === 'number') {
        return right({ valueType: 'number', value: lhs.returnValue + rhs.returnValue });
    }
    if (lhs.returnType === 'degree' && rhs.returnType === 'degree') {
        return right({ valueType: 'degree', value: lhs.returnValue + rhs.returnValue });
    }
    if (lhs.returnType === 'pitch' && rhs.returnType === 'pitch') {
        return right({ valueType: 'list pitch', value: [lhs.returnValue, rhs.returnValue] });
    }
    // TODO make this generic, if it contains a list
    if (lhs.returnType === 'list pitch' && rhs.returnType === 'pitch') {
        return right({ valueType: 'list pitch', value: [...lhs.returnValue, rhs.returnValue] });
    }
    if (lhs.returnType === 'pitch' && rhs.returnType === 'list pitch') {
        return right({ valueType: 'list pitch', value: [lhs.returnValue, ...rhs.returnValue] });
    }
    if (lhs.returnType === 'list pitch_rhythm' && rhs.returnType === 'pitch_rhythm') {
        console.log("lhs: ", JSON.stringify(lhs.returnValue, null, 2));
        console.log("rhs: ", JSON.stringify(rhs.returnValue, null, 2));
        return right({ valueType: 'list pitch_rhythm', value: [...lhs.returnValue, rhs.returnValue] });
    }
    if (lhs.returnType === 'pitch_rhythm' && rhs.returnType === 'list pitch_rhythm') {
        return right({ valueType: 'list pitch_rhythm', value: [lhs.returnValue, ...rhs.returnValue] });
    }
    if (lhs.returnType === 'list pitch_rhythm' && rhs.returnType === 'list pitch_rhythm') {
        return right({ valueType: 'list pitch_rhythm', value: [...lhs.returnValue, ...rhs.returnValue] });
    }
    if (lhs.returnType === 'pitch' && rhs.returnType === 'rhythm') {
        return right({
            valueType: 'pitch_rhythm',
            value: {
                _type: 'LiteralPitchRhythm',
                rhythm: rhs.returnValue,
                pitches: lhs.returnValue.pitches,
                token: operatorToken,
                returnType: 'pitch_rhythm',
            },
        });
        /*
        return left({
            line: 0,
            column: 0,
            reason: `Addition unimplemented for types "${lhs.returnType}" and "${rhs.returnType}"`,
        });
         */
    }
    return left({
        line: 0,
        column: 0,
        reason: `Addition unimplemented for types "${lhs.returnType}" and "${rhs.returnType}"`,
    });
}
