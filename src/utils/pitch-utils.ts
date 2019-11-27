import { Accidental } from '../lexer/expression/literal';
import { Either, left, right } from 'fp-ts/lib/Either';

/*
const PITCH_NUMBER_MAPPING = new Map([
    [21, ['A0']],
    [22, ['A#0', 'Bb0']],
    [23, ['B0', 'Cb1']], // TODO is this 1 or 0?
    [24, ['C1', 'B#1']],
    [25, ['C#1', 'Db1']],
    [26, ['D1']],
    [27, ['D#1', 'Db1']],
    [28, ['E1', 'Fb1']],
    [29, ['F1', 'E#1']],
]);
 */

// The regex for this should probably be:
// [a-gA-G][#|b]?[0-9]

export function isPitchLiteral(input: string): boolean {
    return /^[a-gA-G][#|b]?[0-9]$/.test(input);
}

// source: https://newt.phys.unsw.edu.au/jw/notes.html
//

// Given the information that constitutes a pitch, calculate both the midi number for that pitch and the absolute 'pitch number', which is where A0 is considered 0. The pitch number is 21 less than the midi number.
export function pitchNumbers(
    noteName: string,
    accidental: Accidental,
    octave: number,
): Either<{}, { midiNumber: number; pitchNumber: number }> {
    if (noteName.length > 1 || noteName.length === 0 || noteName.toLowerCase() !== noteName) {
        return left({});
    }
    let notes = {
        a: 0,
        b: 2,
        c: 3,
        d: 5,
        e: 7,
        f: 8,
        g: 10,
    } as any;

    if (notes[noteName] > 2) {
        octave = octave - 1;
    }
    if (octave < 0) {
        return left({});
    }
    let pitchNumber = notes[noteName] + 12 * octave;
    if (accidental === 'flat') {
        pitchNumber = pitchNumber - 1;
    } else if (accidental === 'sharp') {
        pitchNumber = pitchNumber + 1;
    }
    let midiNumber = pitchNumber + 21;

    return right({ midiNumber, pitchNumber });
}
