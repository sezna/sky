import { renderListPitchRhythm } from './list-pitch-rhythm';

export function renderListListPitchRhythm(input: any): string {
    console.log('rendering listlist pitch rhythm');
    let output = '';
    let index = 1;
    for (const voice of input) {
        output += `V${index}:`;
        output += '\n';
        output += renderListPitchRhythm(voice);
        output += '\n';
    }
    return output;
}
