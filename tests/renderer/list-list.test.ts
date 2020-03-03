import { render } from '../../src/renderer';
import { runtime } from '../../src/runtime';
import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

describe('list of notes renderer tests', () => {
    it('should be able to render a piece (aka a list of lists of notes)', () => {
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

        let renderedAbc = render(runtimeResult.right);
        expect(renderedAbc).toBe(`
C: Unspecified
L: 1/128
V:TI clef=treble name="Voice 1" snm="V.1"
V:TII clef=treble name="Voice 2" snm="V.2"
[V:TI] c32^c32d32^d32
[V:TII] e32^d32d32^c32
`);
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

        let renderedAbc = render(runtimeResult.right);
        expect(renderedAbc).toBe(`
C: Unspecified
L: 1/128
V:TI clef=treble name="Voice 1" snm="V.1"
V:TII clef=treble name="Voice 2" snm="V.2"
[V:TI] c32^c32d32^d32
[V:TII] e32^d32d32^c32
`);
    });
    it('should be able to render a larger list of lists of notes', () => {
        let program = `
fn main(): list list pitch_rhythm {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter],
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter, c#3 quarter],
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
        expect(renderedAbc).toBe(`
C: Unspecified
L: 1/128
V:TI clef=treble name="Voice 1" snm="V.1"
V:TII clef=treble name="Voice 2" snm="V.2"
V:TIII clef=treble name="Voice 3" snm="V.3"
V:TIV clef=treble name="Voice 4" snm="V.4"
V:TV clef=treble name="Voice 5" snm="V.5"
V:TVI clef=treble name="Voice 6" snm="V.6"
[V:TI] c32^c32d32^d32
[V:TII] e32^d32d32^c32
[V:TIII] c,32^e,32f,32^g,32
[V:TIV] a,,,32^c,32d,32^d,32
[V:TV] e,32^d,32d,32^c,32
[V:TVI] e32^d32d32^c32
`);
    });
    it('should be able to assign custom clefs', () => {
        let program = `
fn main(): list list pitch_rhythm {
				list list pitch_rhythm x =  [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter],
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter, c#3 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								];
								x[0].clef = treble;
								x[1].clef = bass;
								x[2].clef = alto;
								return x;

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
        expect(renderedAbc).toBe(`
C: Unspecified
L: 1/128
V:TI clef=treble name="Voice 1" snm="V.1"
V:TII clef=bass name="Voice 2" snm="V.2"
V:TIII clef=alto name="Voice 3" snm="V.3"
V:TIV clef=treble name="Voice 4" snm="V.4"
V:TV clef=treble name="Voice 5" snm="V.5"
V:TVI clef=treble name="Voice 6" snm="V.6"
[V:TI] c32^c32d32^d32
[V:TII] e32^d32d32^c32
[V:TIII] c,32^e,32f,32^g,32
[V:TIV] a,,,32^c,32d,32^d,32
[V:TV] e,32^d,32d,32^c,32
[V:TVI] e32^d32d32^c32
`);
    });
    it('should be able to define a composer', () => {
        let program = `
fn main(): list list pitch_rhythm {
				list list pitch_rhythm x =  [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter],
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter, c#3 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter]
								];
                x.composer = Alex Hansen;
								return x;
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
        expect(renderedAbc).toBe(`
C: Alex Hansen
L: 1/128
V:TI clef=treble name="Voice 1" snm="V.1"
V:TII clef=treble name="Voice 2" snm="V.2"
V:TIII clef=treble name="Voice 3" snm="V.3"
V:TIV clef=treble name="Voice 4" snm="V.4"
V:TV clef=treble name="Voice 5" snm="V.5"
V:TVI clef=treble name="Voice 6" snm="V.6"
[V:TI] c32^c32d32^d32
[V:TII] e32^d32d32^c32
[V:TIII] c,32^e,32f,32^g,32
[V:TIV] a,,,32^c,32d,32^d,32
[V:TV] e,32^d,32d,32^c,32
[V:TVI] e32^d32d32^c32
`);
    });
    // This next test brings up an interesting case - there should be two stdlib funcs, one that prepends rests until a certain
    // length and one that appends, for matching up parts in cases like this
    /* This is unimplemented -- there should be an error coming out of the runtime step  if a step is too short
    it('should throw an error if one of the parts is too short', () => {
        let program = `
fn main(): list list pitch_rhythm {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter],
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter],
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
				/* This is unimplemented -- there should be an error coming out of the runtime step 
    it('should throw an error if one of the parts is too long', () => {
        let program = `
fn main(): list list pitch_rhythm {
				return [
								[c4 quarter, c#4 quarter, d4 quarter, d#4 quarter],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter],
								[c3 quarter, e#3 quarter, f3 quarter, g#3 quarter],
								[a1 quarter, c#3 quarter, d3 quarter, d#3 quarter],
								[e3 quarter, d#3 quarter, d3 quarter, d2 dotted whole],
								[e4 quarter, d#4 quarter, d4 quarter, c#4 quarter],
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
        if (isRight(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }
				expect(isLeft(runtimeResult)).toBe(true);
				expect(runtimeResult.left.reason).toBe("TODO");

        let renderedAbc = render(runtimeResult.right);
						expect(renderedAbc).toBe(`
C: Unspecified
L: 1/128
V1:
c32^c32d32^d32
V2:
e32^d32d32^c32
V3:
c,32^e,32f,32^g,32
V4:
a,,,32^c,32d,32^d,32
V5:
e,32^d,32d,32d,,192
V6:
e32^d32d32^c32
`);
    });
				 */
});
