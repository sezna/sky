import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';
import { renderPitchRhythm } from './pitch-rhythm';
import { renderListPitch } from './list-pitch';

/**
 * Takes the runtime output (the return value from the main function) and renders it into musicXML.
 */
export function render(input: RuntimeOutput): string {
    const mainReturnType = input.mainReturn.returnType;
    let output = '';

    switch (mainReturnType) {
        case 'pitch':
            output += renderPitch(input.mainReturn);
            break;
        case 'pitch_rhythm':
            output += renderPitchRhythm(input.mainReturn);
            break;
        case 'list pitch':
            output += renderListPitch(input.mainReturn);
        // case 'list pitch_rhythm':
        //     output += renderListPitchRhythm(input.mainReturn);
        default:
            console.log(`Type "${mainReturnType}" cannot currently be rendered into XML. Failed to render:
${JSON.stringify(input.mainReturn.returnValue, null, 2)}`);
    }
    return output;
}
