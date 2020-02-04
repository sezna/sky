import { LiteralRhythm } from '../lexer/expression/literal';

/**
 * Generate header information pertaining to voices.
 * Currently just defaults to treble clef with numbered voices.
 * Support for other attributes is TODO.
 * See this page for an idea of what needs to be done: http://abcnotation.com/wiki/abc:standard:v2.1#multiple_voices
 */
export function generateHeader(input: any): string {
    const numberOfVoices = input.length;
    let output = '';
    for (let voiceIndex = 1; voiceIndex < numberOfVoices; voiceIndex++) {
        output += `V:T${romanize(voiceIndex)} clef=treble-8 name="Voice ${voiceIndex}" snm="V.${voiceIndex}"\n`;
    }
    return output;
}

// https://stackoverflow.com/questions/9083037/convert-a-number-into-a-roman-numeral-in-javascript
// all the libs on npm that do roman numeral conversion are pretty bad
export function romanize(num: number) {
    var digits = String(+num).split(''),
        key = [
            '',
            'C',
            'CC',
            'CCC',
            'CD',
            'D',
            'DC',
            'DCC',
            'DCCC',
            'CM',
            '',
            'X',
            'XX',
            'XXX',
            'XL',
            'L',
            'LX',
            'LXX',
            'LXXX',
            'XC',
            '',
            'I',
            'II',
            'III',
            'IV',
            'V',
            'VI',
            'VII',
            'VIII',
            'IX',
        ],
        roman = '',
        i = 3;
    while (i--) roman = (key[+digits.pop()! + i * 10] || '') + roman;
    return Array(+digits.join('') + 1).join('M') + roman;
}

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
