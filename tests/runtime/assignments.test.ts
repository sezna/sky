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
});
