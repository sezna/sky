import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

export function renderListPitch(input: RuntimeOutput['mainReturn']): string {
    console.log(JSON.stringify(input));
    let output = '';
    for (const note of input.returnValue) {
        output += renderPitch(note);
    }

    return output;
}
