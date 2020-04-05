import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

export function renderPitchRhythm(input: RuntimeOutput['mainReturn']): string {
    return renderPitch(input, input.returnValue.rhythm).output;
}
