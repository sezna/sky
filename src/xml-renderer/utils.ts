import { LiteralRhythm } from '../lexer/expression/literal/types';

const nameToNumberMapping = {
    'sixty-fourth': 64,
    'thirty-second': 32,
    sixteenth: 16,
    eighth: 8,
    quarter: 4,
    half: 2,
    whole: 1,
};

export function timeSignatureDurationMapping(duration: LiteralRhythm, signature: [number, number]): number {
    const [, bottom] = signature;
    const durationAsNumber = nameToNumberMapping[duration.rhythmName];
    let numBeats = bottom / durationAsNumber;
    // If this is compound time...
    if (duration.isDotted) {
        numBeats = numBeats * 2;
    }
    return numBeats;
}
