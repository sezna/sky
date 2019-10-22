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
