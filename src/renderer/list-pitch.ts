import { renderPitch } from './pitch';
export function renderListPitch(input: any): string {
    let output = '';
    for (const note of input) {
        output += renderPitch(note.returnValue);
    }
    return output;
}
