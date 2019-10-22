const BASIC_SCALE_DEGREES = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

/// Contains all scale degrees and their alterations.
/// e.g. i, ib, i#, etc.
const ALL_SCALE_DEGREES = BASIC_SCALE_DEGREES.reduce(
    (acc, curr) => [...acc, curr, curr + '#', curr + 'b'],
    [] as string[],
);

/// (case-insensitive) matches if the input is a valid scale degree literal
export function isScaleDegree(input: string): boolean {
    return ALL_SCALE_DEGREES.includes(input.toLowerCase());
}

/* WIP
/// 'render' a scale degree given a key and an octave.
export function renderScaleDegree(input: string, key: string, octave: number = 4): string {
    // the "key" is of the form Cmaj, Cmin, etc
    // full list:
    // * cmaj == c-ionian,
    // * c-dorian
    // * c-phrygian
    // * c-lydian
    // * c-mixolydian
    // * cmin == c-aeolian,
    // * c-locrian

    input = input.toLowerCase();

    if (input === 'cmaj') {
        input = 'c-ionian';
    } else if (input === 'cmin') {
        input = 'c-aeolian';
    }
}
*/
