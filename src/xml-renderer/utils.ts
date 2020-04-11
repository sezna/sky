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

/**
 *
 * @param duration a rhythm representing this beat's duration
 * @param signature the time signature
 *
 * @returns how many beats this note takes up
 */
export function timeSignatureDurationMapping(duration: LiteralRhythm, signature: [number, number]): number {
    const [, bottom] = signature;
    const durationAsNumber = nameToNumberMapping[duration.rhythmName];
    let numBeats = bottom / durationAsNumber;
    if (duration.isDotted) {
        numBeats = numBeats * 1.5;
    }
    return numBeats;
}

export function generateHeader(): string {
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">`;
}
export function generateCloser(): string {
    return `
</score-partwise>`;
}

/** https://usermanuals.musicxml.com/MusicXML/Content/EL-MusicXML-divisions.html
 * The duration is how many divisions constitute a note, and the divisions are how many
 * add up to one beat. For now, we are defaulting to 144 since it is sufficiently large
 * and divisible by both many triples as well as duples, making it fitting for compound time
 * as well as regular time.
 */
export function calculateDuration(duration: LiteralRhythm, divisions = 144): number {
    let divs;
    switch (duration.rhythmName) {
        case 'sixty-fourth':
            // A 64th note is 1/16th of a single quarter note, so
            // divisions / 16
            divs = divisions / 16;
            break;
        case 'thirty-second':
            // divisions / 8
            divs = divisions / 8;
            break;
        case 'sixteenth':
            // divisions / 4
            divs = divisions / 4;
            break;
        case 'eighth':
            // divisions / 2
            divs = divisions / 2;
            break;
        case 'quarter':
            divs = divisions;
            break;
        case 'half':
            divs = divisions * 2;
            break;
        case 'whole':
            divs = divisions * 4;
            break;
    }
    if (duration.isDotted) {
        divs = divs * 1.5;
    }

    return divs;
}

