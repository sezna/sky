import { RuntimeOutput } from '../runtime';
import { handleGlobalMetadata } from './utils';
import { renderPitchRhythm } from './pitch-rhythm';
import { renderPitch } from './pitch';
import { renderListPitchRhythm } from './list-pitch-rhythm';
import { renderListPitch } from './list-pitch';
import { renderListListPitchRhythm } from './list-list-pitch-rhythm';

/**
 * This function takes whatever the main sky function returned and renders it into the output.
 */
export function render(input: RuntimeOutput): string {
    let mainReturnType = input.mainReturn.returnType;
    let mainReturnValue = input.mainReturn.returnValue;
    let output = handleGlobalMetadata(input);
    // Pattern match each potential return type here
    switch (mainReturnType) {
        case 'pitch':
            output += renderPitch(mainReturnValue);
            break;
        case 'pitch_rhythm':
            output += renderPitchRhythm(input.mainReturn);
            break;
        case 'list pitch_rhythm':
            output += renderListPitchRhythm(mainReturnValue);
            break;
        case 'list pitch':
            output += renderListPitch(mainReturnValue);
            break;
        case 'list list pitch_rhythm':
            output += renderListListPitchRhythm(mainReturnValue);
            break;
        default:
            console.log(`Type "${mainReturnType}" cannot currently be rendered. Failed to render:
${JSON.stringify(mainReturnValue, null, 2)}`);
    }

    return output;
}
