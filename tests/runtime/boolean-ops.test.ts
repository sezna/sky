import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('boolean operator tests', () => {
    it('should evaluate true and true to be true', () => {
        let program = `fn main(): boolean { boolean bool = true && true; return bool;}`;
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
        expect(result.right.mainReturn.returnValue).toEqual(true);
    });
    it('should evaluate false and false to be false', () => {
        let program = `fn main(): boolean { boolean bool = false && false; return bool; }`;
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
        expect(result.right.mainReturn.returnValue).toEqual(false);
    });
    it('should evaluate false and true to be false', () => {
        let program = `fn main(): boolean { boolean bool = false && true; return bool;}`;
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
        expect(result.right.mainReturn.returnValue).toEqual(false);
    });
    it('should evaluate true and false to be false', () => {
        let program = `fn main(): boolean { boolean bool = true && false; return bool; }`;
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
        expect(result.right.mainReturn.returnValue).toEqual(false);
    });
    it('should evaluate true or false to be true', () => {
        let program = `fn main(): boolean { boolean bool = true || false; return bool; }`;
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
        expect(result.right.mainReturn.returnValue).toEqual(true);
    });
    it('should evaluate true or true to be true', () => {
        let program = `fn main(): boolean { boolean bool = true || true; return bool; }`;
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
        expect(result.right.mainReturn.returnValue).toEqual(true);
    });
    it('should evaluate false or false to be false', () => {
        let program = `fn main(): boolean { boolean bool = false || false; return bool; }`;
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
        expect(result.right.mainReturn.returnValue).toEqual(false);
    });
});
