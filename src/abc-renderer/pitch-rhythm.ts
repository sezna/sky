import { convertDurationToAbc } from './utils';
import { renderPitch } from './pitch';
export function renderPitchRhythm(note: any): string {
    //    let dynamic = note.properties && note.properties.dynamic ? `!${note.properties.dynamic}!` : '';
    //    return `${dynamic}${(sharpFlatABCMapping as any)[note.returnValue.accidental]}${
    //      note.returnValue.noteName
    //  }${convertOctaveToAbc(note.returnValue.octave)}${convertDurationToAbc(note.returnValue.rhythm)}`;
    return `${renderPitch(note, convertDurationToAbc(note.returnValue.rhythm))}`;
}
