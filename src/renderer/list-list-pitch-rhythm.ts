import { renderListPitchRhythm } from './list-pitch-rhythm';

export function renderListListPitchRhythm(input: any): string {
    let output = generateHeader(input.length);
    let index = 1;
    for (const voice of input) {
        output += `[V:T${romanize(index)}] `;
        output += renderListPitchRhythm(voice.returnValue);
        output += '\n';
        index += 1;
    }
    return output;
}

/**
 * Generate header information pertaining to voices.
 * Currently just defaults to treble clef with numbered voices.
 * Support for other attributes is TODO.
 * See this page for an idea of what needs to be done: http://abcnotation.com/wiki/abc:standard:v2.1#multiple_voices
 */
function generateHeader(numberOfVoices: number): string {
    let output = '';
    for (let voiceIndex = 1; voiceIndex < numberOfVoices; voiceIndex++) {
        output += `V:T${romanize(voiceIndex)} clef=treble-8 name="Voice ${voiceIndex}" snm="V.${voiceIndex}"\n`;
    }
    return output;
}

// https://stackoverflow.com/questions/9083037/convert-a-number-into-a-roman-numeral-in-javascript
// all the libs on npm that do roman numeral conversion are pretty bad
function romanize(num: number) {
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
