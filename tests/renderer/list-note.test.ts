import { render } from '../../src/renderer';
import { runtime } from '../../src/runtime';
import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

describe('list of notes renderer tests', () => {
    it('Should be able to render a chromatic list of quarter notes', () => {
        let program = `fn main(): list pitch_rhythm { return [c4 quarter, c#4 quarter, d4 quarter, d#4 quarter]; }`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(`Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}`);
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedAbc = render(runtimeResult.right);
        expect(renderedAbc.split('\n').pop()).toBe('c32^c32d32^d32');
    });
    it('Should be able to render a chromatic list of half notes', () => {
        let program = `fn main(): list pitch_rhythm { return [a1 half, a#1 half, b1 half, c1 half]; }`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(`Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}`);
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedAbc = render(runtimeResult.right);
        expect(renderedAbc.split('\n').pop()).toBe('a,,,64^a,,,64b,,,64c,,,64');
    });
    it('Should be able to render a chromatic list with differing durations', () => {
        let program = `fn main(): list pitch_rhythm { return [a5 half, a#5 eighth, b5 dotted quarter, c5 dotted half]; }`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(`Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}`);
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedAbc = render(runtimeResult.right);
        expect(renderedAbc.split('\n').pop()).toBe("a'64^a'16b'48c'96");
    });
    it('Should be able to render a chromatic list of pitches with no specified rhythm, defaulting to quarter notes', () => {
        let program = `
fn main(): list pitch { 
return [a5, a#5, b5, c5]; }`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(`Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}`);
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedAbc = render(runtimeResult.right);
        expect(renderedAbc.split('\n').pop()).toBe("a'32^a'32b'32c'32");
    });
});
