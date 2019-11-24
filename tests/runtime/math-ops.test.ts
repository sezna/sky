import { evaluate } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('math operator tests', () => {
    it('evaluate should be able to add two numbers and declare variables', () => {
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
    it('evaluate should be able to subtract two numbers and declare variables', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'number',
                value: 3,
            },
            y: {
                varType: 'number',
                value: 5,
            },
        };
        let tokens = tokenize('number x = 3; number y = 5; number z = x - y;');
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
        expect(result.right.variableEnvironment['z'].value).toEqual(-2);
    });
    it('evaluate should be able to divide two numbers and declare variables', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'number',
                value: 5,
            },
            y: {
                varType: 'number',
                value: 4,
            },
        };
        let tokens = tokenize('number x = 5; number y = 4; number z=x/y;');
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
        expect(result.right.variableEnvironment['z'].value).toEqual(1.25);
    });
    it('evaluate should be able to multiply two numbers and declare variables', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'number',
                value: 20,
            },
            y: {
                varType: 'number',
                value: 102,
            },
        };
        let tokens = tokenize('number x = 20; number y = 102; number z=x*y;');
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
        expect(result.right.variableEnvironment['z'].value).toEqual(2040);
    });
    it('evaluate should be able to multiply/add in the correct order of operations', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'number',
                value: 10,
            },
            y: {
                varType: 'number',
                value: 2,
            },
            z: {
                varType: 'number',
                value: 1,
            },
        };
        let tokens = tokenize('number x = 10; number y = 2; number z=1; number a = z + y * x;');
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = evaluate(steps.right[3], functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['a'].value).toEqual(21);
    });
    it('evaluate should be able to multiply/add with overridden order of operations via parenthesis', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'number',
                value: 10,
            },
            y: {
                varType: 'number',
                value: 2,
            },
            z: {
                varType: 'number',
                value: 1,
            },
        };
        let tokens = tokenize('number x = 10; number y = 2; number z=1; number a = (z + y) * x;');
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = evaluate(steps.right[3], functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['a'].value).toEqual(30);
    });
    it('evaluate should be able to combine variables and literals', () => {
        let functionEnvironment = {};
        let variableEnvironment = {
            x: {
                varType: 'number',
                value: 10,
            },
            y: {
                varType: 'number',
                value: 2,
            },
            z: {
                varType: 'number',
                value: 1,
            },
        };
        let tokens = tokenize('number x = 10; number y = 2; number z=1; number a = (z + y) * x + 2;');
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = evaluate(steps.right[3], functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            // for typescript's type inference
            expect(true).toBe(false);
            return;
        }
        expect(result.right.variableEnvironment['a'].value).toEqual(32);
    });
});
