import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

export function renderPitchRhythm(input: RuntimeOutput['mainReturn'], isLast: boolean): string {
    return renderPitch(input, isLast, input.returnValue.rhythm).output;
}
