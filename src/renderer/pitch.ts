import { convertOctaveToAbc, sharpFlatABCMapping } from './utils';

export function renderPitch(input: any): string {
    return `${(sharpFlatABCMapping as any)[input.accidental]}${input.noteName}${convertOctaveToAbc(input.octave)}32`; // default to a quarter (32) for non-rhythm'd notes.
}
