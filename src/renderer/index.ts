import { RuntimeOutput } from '../runtime';
import { LiteralRhythm } from '../lexer/expression/literal';

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
            {
                let abcNote = `${(sharpFlatABCMapping as any)[mainReturnValue.accidental]}${
                    mainReturnValue.noteName
                }${convertOctaveToAbc(mainReturnValue.octave)}${convertDurationToAbc(mainReturnValue.rhythm)}`;
                output += abcNote;
            }
            break;
        default:
            console.log(`Type "${mainReturnType}" cannot currently be rendered. Failed to render:
${JSON.stringify(mainReturnValue, null, 2)}`);
    }

    return output;
}

/**
 * Convert the rhythm names into ABC note numbers.
 */
function convertDurationToAbc(input: LiteralRhythm): string {
    let output;
    switch (input.rhythmName) {
        case 'sixty-fourth':
            output = 2;
            break;
        case 'thirty-second':
            output = 4;
            break;
        case 'sixteenth':
            output = 8;
            break;
        case 'eighth':
            output = 16;
            break;
        case 'quarter':
            output = 32;
            break;
        case 'half':
            output = 64;
            break;
        case 'whole':
            output = 128;
            break;
        default:
            console.log(`That rhythm is unimplemented (${input}).`);
            output = 2;
    }
    if (input.isDotted) {
        output = output * 1.5;
    }
    return output.toString();
}

const sharpFlatABCMapping = {
    sharp: '^',
    flat: '_',
    natural: '',
};

function convertOctaveToAbc(octave: number): string {
    let output = '';
    if (octave < 4) {
        output = ','.repeat(4 - octave);
    } else if (octave > 4) {
        output = "'".repeat(octave - 4);
    }
    return output;
}

/**
 * TODO this should handle authorship data and whatnot
 */
function handleGlobalMetadata(): string {
    return `
A: Alex Hansen
L: 1/128
`;
}

/**
 * TODO this function should take an instance of localmetadata, which can be attached to any type,
 * and convert it into the abcjs version to be added to a note.
function renderLocalMetadata() {

}
 */
