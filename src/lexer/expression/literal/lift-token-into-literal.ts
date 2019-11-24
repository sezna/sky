import { scaleDegreeToInt } from '../../../utils/scale-degree-utils';
import { ParseError } from '../../parser';
import { Token } from '../../tokenizer';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { LiteralExp, RhythmName, LiteralValue } from './types';

export function liftTokenIntoLiteral(input: Token): Either<ParseError, LiteralExp> {
    let literalValue: LiteralValue;
    let token = input;
    switch (input.tokenType) {
        case 'numeric-literal':
            {
                literalValue = {
                    _type: 'LiteralNumber' as const,
                    numericValue: parseInt(input.value.value),
                    token,
                };
            }
            break;
        case 'scale-degree-literal':
            {
                let parseResult = scaleDegreeToInt(input);
                if (isLeft(parseResult)) {
                    return parseResult;
                }
                let scaleDegreeNumber = parseResult.right;
                literalValue = {
                    _type: 'LiteralScaleDegree',
                    scaleDegreeNumber,
                    token,
                };
            }
            break;
        case 'scale-degree-rhythm-literal':
            {
                // This could be better.
                let scaleDegree = { ...input };
                scaleDegree.value.value = scaleDegree.value.value.split(' ')[0];
                let parseResult = scaleDegreeToInt(scaleDegree);
                if (isLeft(parseResult)) {
                    return parseResult;
                }
                let scaleDegreeNumber = parseResult.right;
                let rhythmName = token.value.value.split(' ')[token.value.value.split(' ').length - 1] as RhythmName;
                let isDotted = token.value.value.indexOf('dotted') > 0;
                literalValue = {
                    _type: 'LiteralScaleDegreeRhythm',
                    scaleDegreeNumber,
                    rhythm: { _type: 'LiteralRhythm', rhythmName, isDotted, token },
                    token,
                };
            }
            break;
        case 'rhythm-literal':
            {
                let isDotted = token.value.value.indexOf('dotted') > 0;
                literalValue = {
                    _type: 'LiteralRhythm',
                    rhythmName: token.value.value.split(' ')[token.value.value.split(' ').length - 1] as RhythmName,
                    isDotted,
                    token,
                };
            }
            break;
        case 'pitch-literal':
            {
                let octave = parseInt(token.value.value.split('').filter(x => parseInt(x))[0]);

                // eventually I will need to know the most useful way of representing a note here
                literalValue = {
                    _type: 'LiteralPitch',
                    noteName: token.value.value,
                    octave,
                    token,
                };
            }
            break;
        case 'pitch-rhythm-literal':
            {
                let octave = parseInt(token.value.value.split('').filter(x => parseInt(x))[0]);
                let isDotted = token.value.value.indexOf('dotted') > 0;

                // eventually I will need to know the most useful way of representing a note here
                let rhythmName = token.value.value.split(' ')[token.value.value.split(' ').length - 1] as RhythmName;
                literalValue = {
                    _type: 'LiteralPitchRhythm',
                    noteName: token.value.value,
                    rhythm: { _type: 'LiteralRhythm', rhythmName, isDotted, token },
                    octave,
                    token,
                };
            }
            break;
        default:
            return left({
                line: 0,
                column: 0,
                reason: `unimplemented literal ${input.tokenType} ${input.value.value}`,
            });
    }

    return right({ _type: 'LiteralExp' as const, literalValue });
}
