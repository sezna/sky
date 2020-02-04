import { renderListPitchRhythm } from './list-pitch-rhythm';
import { generateHeader, romanize } from './utils';

export function renderListListPitchRhythm(input: any): string {
    let output = generateHeader(input);
    let index = 1;
    for (const voice of input) {
        output += `[V:T${romanize(index)}] `;
        output += renderListPitchRhythm(voice.returnValue);
        output += '\n';
        index += 1;
    }
    return output;
}
