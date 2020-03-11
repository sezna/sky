import { renderListPitchRhythm } from './list-pitch-rhythm';
import { generateVoiceHeaders, romanize } from './utils';
import { FunctionEvaluationResult } from '../runtime/eval-function';

export function renderListListPitchRhythm(voices: FunctionEvaluationResult['returnValue']): string {
    let voiceHeaders = generateVoiceHeaders(voices);
    let output = '';
    let index = 1;
    for (const voice of voices) {
        output += voiceHeaders[index - 1];
        output += `[V:T${romanize(index)}] `;
        output += renderListPitchRhythm(voice.returnValue);
        output += '\n';
        index += 1;
    }
    return output;
}
