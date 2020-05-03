import { RuntimeOutput } from '../runtime';
import { renderPitch, PitchRenderResult } from './pitch';

export function renderPitchRhythm(
    input: RuntimeOutput['mainReturn'],
    isLast: boolean,
    status?: PitchRenderResult,
): PitchRenderResult {
    return renderPitch(input, isLast, input.returnValue.rhythm, status);
}
