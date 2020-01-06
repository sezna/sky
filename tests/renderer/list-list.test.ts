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

        let renderedAbc = render(runtimeResult.right);
        expect(renderedAbc.split('\n').pop()).toBe('TODO');
    });
});
