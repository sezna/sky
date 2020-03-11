import { renderPitchRhythm } from './pitch-rhythm';
// TODO work on these any types
export function renderListPitchRhythm(input: any): string {
    let output = '';
    for (const note of input) {
        output += renderPitchRhythm(note);
    }
    return output;
}
