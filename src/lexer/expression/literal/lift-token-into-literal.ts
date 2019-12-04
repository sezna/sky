import { scaleDegreeToInt } from '../../../utils/scale-degree-utils';
import { pitchNumbers } from '../../../utils/pitch-utils';
import { ParseError } from '../../parser';
import { Token } from '../../tokenizer';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { Accidental, LiteralExp, RhythmName, LiteralValue } from './types';

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
                    returnType: 'number',
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
                    returnType: 'degree',
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
                    rhythm: { _type: 'LiteralRhythm', rhythmName, isDotted, token, returnType: 'rhythm' },
                    token,
                    returnType: 'degree-rhythm',
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
                    returnType: 'rhythm',
                };
            }
            break;
        case 'pitch-literal':
            {
                let octave = parseInt(token.value.value.replace(/[^0-9]/g, ''));

                // the first letter is the note name, always
                let noteName = token.value.value[0].toLowerCase();

                let accidentalChar = token.value.value.slice(1, 2);
                let accidental = 'natural' as Accidental;
                if (accidentalChar === 'b') {
                    accidental = 'flat' as const;
                } else if (accidentalChar === '#') {
                    accidental = 'sharp' as const;
                }

                let result = pitchNumbers(noteName, accidental, octave);
                if (isLeft(result)) {
                    return left({
                        line: token.value.line,
                        column: token.value.column,
                        reason: `Invalid pitch literal: ${token.value.value} is not a valid pitch`,
                    });
                }

                let { midiNumber, pitchNumber } = result.right;

                literalValue = {
                    _type: 'LiteralPitch',
                    noteName,
                    midiNumber,
                    pitchNumber,
                    accidental,
                    octave,
                    token,
                    returnType: 'pitch',
                };
            }
            break;
        case 'pitch-rhythm-literal':
            {
                let noteName = token.value.value[0];
                let octave = parseInt(token.value.value.split('').filter(x => parseInt(x))[0]);
                let isDotted = token.value.value.indexOf('dotted') > 0;
                let accidentalChar = token.value.value.slice(1, 2);
                let accidental = 'natural' as Accidental;
                if (accidentalChar === 'b') {
                    accidental = 'flat' as const;
                } else if (accidentalChar === '#') {
                    accidental = 'sharp' as const;
                }

                // eventually I will need to know the most useful way of representing a note here
                let rhythmName = token.value.value.split(' ')[token.value.value.split(' ').length - 1] as RhythmName;
                literalValue = {
                    _type: 'LiteralPitchRhythm',
                    noteName,
                    accidental,
                    rhythm: { _type: 'LiteralRhythm', rhythmName, isDotted, token, returnType: 'rhythm' },
                    octave,
                    token,
                    returnType: 'pitch-rhythm',
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

    return right({ _type: 'LiteralExp' as const, literalValue, returnType: literalValue._type });
}
