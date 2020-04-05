import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

export function renderListPitchRhythm(input: RuntimeOutput['mainReturn']): string {
    let output = '';

    for (const note of input.returnValue) {
        output += renderPitch(note, input.returnValue.rhythm);
    }

    return output;
}
