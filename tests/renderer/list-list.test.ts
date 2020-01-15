import { render } from '../../src/renderer';
import { runtime } from '../../src/runtime';
import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

describe('list of notes renderer tests', () => {
    it('should be able to render a piece (aka a list of lists of notes)', () => {
        let program = `
fn main(): piece {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								];
				}`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(
                `Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}: ${stepsResult.left.reason}`,
            );
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
        expect(renderedAbc.split('\n').pop()).toBe('TODO');
    });
    it('should be able to render a list of lists of notes (aka a song or piece)', () => {
        let program = `
fn main(): list list pitch_rhythm {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								];
				}`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(
                `Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}: ${stepsResult.left.reason}`,
            );
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedAbc = render(runtimeResult.right).split('\n');
        expect(renderedAbc.pop()).toBe('c32^c32d32^d32e32^d32d32^c32');
        //        expect(renderedAbc.pop()).toBe('V2:');
        renderedAbc.pop();
        expect(renderedAbc.pop()).toBe('V2:');
    });
    it('should be able to render a larger list of lists of notes (aka a song or piece)', () => {
        let program = `
fn main(): list list pitch_rhythm {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter, c#3 quarter]
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								];
				}`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(
                `Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}: ${stepsResult.left.reason}`,
            );
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
        expect(renderedAbc.split('\n').pop()).toBe('TODO');
    });
    // This next test brings up an interesting case - there should be two stdlib funcs, one that prepends rests until a certain
    // length and one that appends, for matching up parts in cases like this
    it('should throw an error if one of the parts is too short', () => {
        let program = `
fn main(): list list pitch_rhythm {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter]
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								];
				}`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(
                `Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}: ${stepsResult.left.reason}`,
            );
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
        expect(renderedAbc.split('\n').pop()).toBe('TODO');
    });
    it('should throw an error if one of the parts is too long', () => {
        let program = `
fn main(): list list pitch_rhythm {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter, d2 dotted whole],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								];
				}`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(
                `Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}: ${stepsResult.left.reason}`,
            );
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
        expect(renderedAbc.split('\n').pop()).toBe('TODO');
    });
});
