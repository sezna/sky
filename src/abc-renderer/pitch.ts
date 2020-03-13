import { convertOctaveToAbc, sharpFlatABCMapping } from './utils';

export function renderPitch(input: any, duration = '32'): string {
    const dynamic = input.properties && input.properties.dynamic ? `!${input.properties.dynamic}!` : '';
    const accidental = input.returnValue.accidental ? (sharpFlatABCMapping as any)[input.returnValue.accidental] : '';
    return `${dynamic}${accidental}${input.returnValue.noteName}${convertOctaveToAbc(
        input.returnValue.octave,
    )}${duration}`;
}
