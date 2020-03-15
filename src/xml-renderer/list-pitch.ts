import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

export function renderListPitch(input: RuntimeOutput['mainReturn']): string {
    let output = '';
    for (const note of input.returnValue) {
        output += renderPitch(note);
    }

    return output;
}
