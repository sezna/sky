import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft, isRight } from 'fp-ts/lib/Either';

describe('assignment and reassignment tests', () => {
    it('be able to reassign a variable', () => {
        let program = `
				fn main(): number {
								number x = 0;
								number y = 1;	
								x = 3;
								y = x;
								x = 5;
								return 0;
				}
				`;
        let tokens = tokenize(program);
        let steps = makeSyntaxTree(tokens);
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
        expect(result.right.variableEnvironment['y'].value).toEqual(3);
        expect(result.right.variableEnvironment['x'].value).toEqual(5);
    });
    it('be able to assign a property', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x.clef = bass;
								return 0;
				}
				`;
        let tokens = tokenize(program);
        let steps = makeSyntaxTree(tokens);
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
        expect(result.right.variableEnvironment['x'].properties).toHaveProperty('clef');
        expect(result.right.variableEnvironment['x'].properties.clef).toEqual('bass');
    });
    it('be able to reassign a property', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x.clef = bass;
								x.clef = treble;
								return 0;
				}
				`;
        let tokens = tokenize(program);
        let steps = makeSyntaxTree(tokens);
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
        expect(result.right.variableEnvironment['x'].properties).toHaveProperty('clef');
        expect(result.right.variableEnvironment['x'].properties.clef).toEqual('treble');
    });
    it('be able to assign a multi-word property', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x.dynamic = mezzo forte;
								return 0;
				}
				`;
        let tokens = tokenize(program);
        let steps = makeSyntaxTree(tokens);
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
        expect(result.right.variableEnvironment['x'].properties).toHaveProperty('dynamic');
        expect(result.right.variableEnvironment['x'].properties.dynamic).toEqual('mezzo forte');
    });
    it('be able to reassign a multi-word property', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x.dynamic = mezzo forte;
								x.dynamic = forte;
								return 0;
				}
				`;
        let tokens = tokenize(program);
        let steps = makeSyntaxTree(tokens);
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
        expect(result.right.variableEnvironment['x'].properties).toHaveProperty('dynamic');
        expect(result.right.variableEnvironment['x'].properties.dynamic).toEqual('forte');
    });
    it('should reject an invalid property', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x.clef = something invalid;
								return 0;
				}
				`;
        let tokens = tokenize(program);
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe('Value "something invalid" is not a valid property value.');
    });
    it('should reject a reassignment of the wrong type', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x = c#3;
								return x;
				}
				`;
        let tokens = tokenize(program);
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            'Attempted to assign value of type "pitch" to variable "x", which has type "number".',
        );
    });
});
