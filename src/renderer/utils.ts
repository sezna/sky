import { LiteralRhythm } from '../lexer/expression/literal';

/**
 * Convert the rhythm names into ABC note numbers.
 */
export function convertDurationToAbc(input: LiteralRhythm): string {
    let output;
    switch (input.rhythmName) {
        case 'sixty-fourth':
            output = 2;
            break;
        case 'thirty-second':
            output = 4;
            break;
        case 'sixteenth':
            output = 8;
            break;
        case 'eighth':
            output = 16;
            break;
        case 'quarter':
            output = 32;
            break;
        case 'half':
            output = 64;
            break;
        case 'whole':
            output = 128;
            break;
        default:
            console.log(`That rhythm is unimplemented (${input}).`);
            output = 2;
    }
    if (input.isDotted) {
        output = output * 1.5;
    }
    return output.toString();
}

export const sharpFlatABCMapping = {
    sharp: '^',
    flat: '_',
    natural: '',
};

export function convertOctaveToAbc(octave: number): string {
    let output = '';
    if (octave < 4) {
        output = ','.repeat(4 - octave);
    } else if (octave > 4) {
        output = "'".repeat(octave - 4);
    }
    return output;
}

/**
 * TODO this should handle authorship data and whatnot
 */
export function handleGlobalMetadata(): string {
    return `
A: Alex Hansen
L: 1/128
`;
}

/**
 * TODO this function should take an instance of localmetadata, which can be attached to any type,
 * and convert it into the abcjs version to be added to a note.
function renderLocalMetadata() {

}
 */
