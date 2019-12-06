import { evaluate } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('scale degree operator tests', () => {
    it('Adding two scale degrees should work', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'degree',
                value: 3,
            },
            y: {
                varType: 'degree',
                value: 1,
            },
        };
        let tokens = tokenize('degree x = iii; degree y = ii; degree z = x + y;');
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = evaluate(steps.right[2], functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['z'].value).toEqual(4);
    });
    it('Subtracting two scale degrees should work', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'degree',
                value: '3',
            },
            y: {
                varType: 'degree',
                value: '1',
            },
        };
        let tokens = tokenize('degree x = iv; degree y = i; degree z = x - y;');
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = evaluate(steps.right[2], functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['z'].value).toEqual(2);
    });
});
