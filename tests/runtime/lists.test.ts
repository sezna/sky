import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft, isRight } from 'fp-ts/lib/Either';

describe('runtime list tests', () => {
    it('should allow lists with the same inner type', () => {
        let program = `fn main(): number { list pitch x = [a1, b1, c1, d1]; return 0;}`;
        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['x'].varType).toEqual('list pitch');
    });
    it('should not allow lists with different inner types', () => {
        let program = `fn main(): number { list pitch x = [a1, 1, iii, d1]; return 0; }`;
        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = runtime(steps.right);
        if (isRight(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(result)).toBe(true);
    });
    it('should be able to return a list', () => {
        let program = ` fn main(): list number {
        return [1, 2, 3];
      }
      `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
    });
});
