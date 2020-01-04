import { renderPitchRhythm } from './pitch-rhythm';
export function renderListPitchRhythm(input: any): string {
    let output = '';
    for (const note of input) {
        output += renderPitchRhythm(note.returnValue);
    }
    return output;
}
