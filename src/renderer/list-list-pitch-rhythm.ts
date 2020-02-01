import { renderListPitchRhythm } from './list-pitch-rhythm';

export function renderListListPitchRhythm(input: any): string {
    let output = '';
    let index = 1;
    for (const voice of input) {
        output += `V${index}:`;
        output += '\n';
        output += renderListPitchRhythm(voice.returnValue);
        output += '\n';
        index += 1;
    }
    return output;
}
