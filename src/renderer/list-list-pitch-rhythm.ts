import { renderListPitchRhythm } from './list-pitch-rhythm';
import { generateHeader, romanize } from './utils';
import { FunctionEvaluationResult } from '../runtime/eval-function';

export function renderListListPitchRhythm(voices: FunctionEvaluationResult['returnValue']): string {
    let output = generateHeader(voices);
    let index = 1;
    for (const voice of voices) {
        output += `[V:T${romanize(index)}] `;
        output += renderListPitchRhythm(voice.returnValue);
        output += '\n';
        index += 1;
    }
    return output;
}
