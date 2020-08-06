import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('loop tests', () => {
    it('should increment x until it is 10', () => {
        let prog = `fn main(): number {
      number x = 0;
      while x < 10 {
        x = x + 1;
      }
      return x;
    }`;

        let steps = makeSyntaxTree(tokenize(prog));
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
        expect(result.right.mainReturn.returnValue).toEqual(10);
    });
    it('should decrement x until it is 10', () => {
        let prog = `fn main(): number {
      number x = 1000;
      while x > 10 {
        x = x - 10;
      }
      return x;
    }`;

        let steps = makeSyntaxTree(tokenize(prog));
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
        expect(result.right.mainReturn.returnValue).toEqual(10);
    });
    it('should handle many steps in a while loop', () => {
        let prog = `fn main(): number {
      number x = 1000;
      number y = 0;
      while x != y {
        x = x - 10;
        y = y + 10;
      }
      return x;
    }`;

        let steps = makeSyntaxTree(tokenize(prog));
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
        expect(result.right.mainReturn.returnValue).toEqual(10);
    });
});
