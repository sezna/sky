import { convertOctaveToAbc, sharpFlatABCMapping } from './utils';

export function renderPitch(input: any, duration = '32'): string {
    let dynamic = input.properties && input.properties.dynamic ? `!${input.properties.dynamic}!` : '';
    return `${dynamic}${(sharpFlatABCMapping as any)[input.returnValue.accidental]}${
        input.returnValue.noteName
    }${convertOctaveToAbc(input.returnValue.octave)}${duration}`;
}
