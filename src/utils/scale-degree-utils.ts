import { ParseError } from '../lexer/parser';
import { Either, left, right, isLeft } from 'fp-ts/lib/Either';
import { Token } from '../lexer/tokenizer';

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
export function scaleDegreeToInt(input: Token): Either<ParseError, number> {
    let error = {
        line: input.value.line,
        column: input.value.column,
        reason: `Invalid scale degree: ${input.value.value}`,
    };
    let str = input.value.value.toLowerCase(); // TODO diff between upper and lower?

    var numResult = charToInt(str.charAt(0));
    if (isLeft(numResult)) {
        return left(error);
    }
    var num = numResult.right;
    var pre, curr;
    for (var i = 1; i < str.length; i++) {
        let currResult = charToInt(str.charAt(i));
        let preResult = charToInt(str.charAt(i - 1));
        if (isLeft(currResult)) {
            return left(error);
        }
        if (isLeft(preResult)) {
            return left(error);
        }
        curr = currResult.right;
        pre = preResult.right;
        if (curr <= pre) {
            num += curr;
        } else {
            num = num - pre * 2 + curr;
        }
    }
    if (num > 7) {
        return left(error);
    }
    return right(num);
}

function charToInt(c: string): Either<{}, number> {
    switch (c) {
        case 'i':
            return right(1);
        case 'v':
            return right(5);
        default:
            return left({});
    }
}
