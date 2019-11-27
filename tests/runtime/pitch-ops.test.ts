import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('pitch operator tests', () => {
    it('should be able to add two pitches', () => {
        let tokens = tokenize(`fn main():song {
				pitch first = A#2; -- midi note 34 (logical note 34 - 21 = 13)
				pitch second = b0; -- midi note 23 (logical note 23 - 21 = 2)
				pitch third = first + second; -- should be midi note 15 + 21 = 36 = C2

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
