import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('if expr tests', () => {
    it('should correctly assign its result to a variable #1', () => {
        let program = `fn main(): song {
                      number x = if 200 < 5 then 5 else 2;
                   }`;
        let steps = makeSyntaxTree(tokenize(program));

        if (isLeft(steps)) {
            console.log('Error: ', steps.left.reason);
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        let result = runtime(steps.right);

        if (isLeft(result)) {
            console.log('Error: ', result.left.reason);
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['x'].value).toBe(2);
    });
    it('should correctly assign its result to a variable #2', () => {
        let program = `fn main(): song {
                      number x = if 200 > 5 then 6 else 3;
                   }`;
        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Error: ', steps.left.reason);
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        let result = runtime(steps.right);

        if (isLeft(result)) {
            console.log('Error: ', result.left.reason);
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['x'].value).toBe(6);
    });
});
