import { LiteralRhythm } from '../lexer/expression/literal/types';

// This is temporarily exported and used directly until time signatures are implemented.
export const nameToNumberMapping = {
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

export function generateHeader(): string {
return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">`
}
export function generateCloser(): string {
    return `
</score-partwise>`;
}