export function isRhythmLiteral(input: string): boolean {
    return /^(dotted )?(whole|half|quarter|eighth|sixteenth|thirty-second|sixty-fourth)$/.test(input);
}
