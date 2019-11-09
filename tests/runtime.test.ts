import { evaluate } from '../src/runtime';
import { makeSyntaxTree } from '../src/lexer/parser';
import { tokenize } from '../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('runtime tests', () => {
    it('evaluate should, given steps and an environment, evaluate exactly one step and return the updated environment', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'number',
                value: 5,
            },
            y: {
                varType: 'number',
                value: 5,
            },
        };
        let tokens = tokenize('number x = 5; number y = 5; number z = x + y;');
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
        expect(result.right.variableEnvironment['z'].value).toEqual(10);
    });
});
