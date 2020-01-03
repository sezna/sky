import { RuntimeOutput } from '../runtime';
import { handleGlobalMetadata, sharpFlatABCMapping, convertOctaveToAbc } from './utils';
import { renderPitchRhythm } from './pitch_rhythm';

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
            {
                let abcNote = `${(sharpFlatABCMapping as any)[mainReturnValue.accidental]}${
                    mainReturnValue.noteName
                }${convertOctaveToAbc(mainReturnValue.octave)}32`; // default to a quarter (32) for non-rhythm'd notes.
                output += abcNote;
            }
            break;
        case 'pitch_rhythm':
            output += renderPitchRhythm(mainReturnValue);
            break;
        case 'list pitch_rhythm':
            for (const note of mainReturnValue) {
                output += renderPitchRhythm(note.returnValue);
            }
            break;
        default:
            console.log(`Type "${mainReturnType}" cannot currently be rendered. Failed to render:
${JSON.stringify(mainReturnValue, null, 2)}`);
    }

    return output;
}
