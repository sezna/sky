import { RuntimeOutput } from '../runtime';
import { handleGlobalMetadata } from './utils';
import { renderPitchRhythm } from './pitch-rhythm';
import { renderPitch } from './pitch';
import { renderListPitchRhythm } from './list-pitch-rhythm';

/**
 * This function takes whatever the main sky function returned and renders it into the output.
 */
export function render(input: RuntimeOutput): any {
    let mainReturnType = input.mainReturn.returnType;
    let mainReturnValue = input.mainReturn.returnValue.returnValue;
    let output = handleGlobalMetadata();
    // Pattern match each potential return type here
    switch (mainReturnType) {
        case 'pitch':
            output += renderPitch(mainReturnValue);
            break;
        case 'pitch_rhythm':
            output += renderPitchRhythm(mainReturnValue);
            break;
        case 'list pitch_rhythm':
            output += renderListPitchRhythm(mainReturnValue);
            break;
        default:
            console.log(`Type "${mainReturnType}" cannot currently be rendered. Failed to render:
${JSON.stringify(mainReturnValue, null, 2)}`);
    }

    return output;
}
