import { sharpFlatABCMapping, convertDurationToAbc, convertOctaveToAbc } from './utils';
export function renderPitchRhythm(note: any): string {
    return `${(sharpFlatABCMapping as any)[note.accidental]}${note.noteName}${convertOctaveToAbc(
        note.octave,
    )}${convertDurationToAbc(note.rhythm)}`;
}
