import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

// TODO test the lifting here
describe('Extra tests for literals', () => {
    it('Should tokenize numbers as numeric literals and evaluate them correctly', () => {
        let tokens = tokenize('number x = 20 + (10 - 4) * 3 - (2 * (1 - 4));');
        expect(tokens[3].tokenType).toBe('numeric-literal');
    });
    it('Should calculate the correct midi and pitch numbers', () => {
        let tokens = tokenize(`pitch x = a0;
pitch y = a#0;
pitch z = a#1;
pitch outofnames = c4;
											`);
        let stepsResult = makeSyntaxTree(tokens);
        if (isLeft(stepsResult)) {
            console.log('Error: ', stepsResult.left.reason);
            expect(true).toBe(false);
            return;
        }
        let steps = stepsResult.right;
        expect((steps[0] as any).varBody.literalValue.midiNumber).toBe(21);
        expect((steps[0] as any).varBody.literalValue.pitchNumber).toBe(0);
        expect((steps[1] as any).varBody.literalValue.midiNumber).toBe(22);
        expect((steps[1] as any).varBody.literalValue.pitchNumber).toBe(1);
        expect((steps[2] as any).varBody.literalValue.midiNumber).toBe(34);
        expect((steps[2] as any).varBody.literalValue.pitchNumber).toBe(13);
        expect((steps[3] as any).varBody.literalValue.midiNumber).toBe(60);
        expect((steps[3] as any).varBody.literalValue.pitchNumber).toBe(39);
    });
    it('Should reject an invalid pitch', () => {
        let tokens = tokenize(`pitch x = c0; -- there is no c0
											`);
        let stepsResult = makeSyntaxTree(tokens);
        expect(isLeft(stepsResult)).toBe(true);
    });
});
