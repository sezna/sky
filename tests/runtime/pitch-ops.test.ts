import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('pitch operator tests', () => {
    it('should be able to add two pitches', () => {
        let tokens = tokenize(`fn main():song {
				pitch first = A#2; 
				pitch second = b0;
				notes third = first + second; 
			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        let variableEnvironment = result.right.variableEnvironment;
        expect((variableEnvironment['third'] as any).varType).toBe('notes');
        //        expect((variableEnvironment['third'] as any).value).toHaveLength(2);
        expect((variableEnvironment['third'] as any).value[0].noteName).toBe('a');
        expect((variableEnvironment['third'] as any).value[0].accidental).toBe('sharp');
        expect((variableEnvironment['third'] as any).value[0].octave).toBe(2);
        expect((variableEnvironment['third'] as any).value[1].noteName).toBe('b');
        expect((variableEnvironment['third'] as any).value[1].accidental).toBe('natural');
        expect((variableEnvironment['third'] as any).value[1].octave).toBe(0);
    });
    it('Should be able to add a pitch into a list of notes', () => {
        let tokens = tokenize(`fn main():song {
				pitch first = A#2; 
				pitch second = b0; 
				notes third = first + second; 
				notes fourth = third + c#2;
			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        let variableEnvironment = result.right.variableEnvironment;
        expect((variableEnvironment['fourth'] as any).varType).toBe('notes');
        expect((variableEnvironment['fourth'] as any).value[2].noteName).toBe('c');
        expect((variableEnvironment['fourth'] as any).value[2].accidental).toBe('sharp');
        expect((variableEnvironment['fourth'] as any).value[2].octave).toBe(2);
    });
    it('should be able to subtract two pitches', () => {
        let tokens = tokenize(`fn main():song {
				pitch first = F6; -- midi note 89 (logical note 89 - 21 = 68)
				pitch second = b0; -- midi note 23 (logical note 23 - 21 = 2)
				notes third = first - second; -- should be midi note 66 + 21 = 87 = D#6

			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        let variableEnvironment = result.right.variableEnvironment;
        expect(variableEnvironment['third']).toBe('c2');
    });
});
