import { makeSyntaxTree } from '../src/lexer/parser';
import { tokenize } from '../src/lexer/tokenizer';
import { isRight, isLeft } from 'fp-ts/lib/Either';

describe('Invalid ops tests', () => {
    /* If you can think of any invalid operations not already expressed
     * here, please add a test!
     */
    it('Multiplying two scale degrees should fail', () => {
        let tokens = tokenize('degree x = iv; degree y = i; degree z = x * y;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Dividing two scale degrees should fail', () => {
        let tokens = tokenize('degree x = iv; degree y = i; degree z = x / y;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail #1', () => {
        let tokens = tokenize('number x = 10; number y = 2; boolean z = false; number a = (x + y) - z');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail #2', () => {
        let tokens = tokenize('number x = 10; number y = 2; boolean z = false; number a = (x + y - z)');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail #3', () => {
        let tokens = tokenize('number x = 10; number y = 2; boolean z = false; number a = y - z');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail with literals', () => {
        let tokens = tokenize('number z = false + 3;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
});

describe('If expression typechecking', () => {
    it('Should not allow an if expression which returns two different types from its branches', () => {
        let program = `fn main(): song { number x = if true then 5 else false; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            'Mismatched if expression: one branch returns type "number" while the other branch returns type "boolean"',
        );
    });
    it('Should not allow an if expression which returns a different type than the declaration of the variable', () => {
        let program = `fn main(): song { number x = if true then c#4 else d#4; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Should allow an if expression result to be assigned to a variable', () => {
        let program = `fn main(): song { number x = if 3 < 5 then 3 else 5; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isRight(steps)).toBe(true);
    });
    it('Should allow an if expression result to be not assigned to a variable', () => {
        let program = `fn main(): song { if 3 < 5 then 3 else 5; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isRight(steps)).toBe(true);
    });
    it('Should not allow an if expression condition to be non-boolean', () => {
        let program = `fn main(): song { if 5 then 3 else 5; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
});
