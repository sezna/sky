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
