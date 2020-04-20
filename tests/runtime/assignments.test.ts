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
        expect(result.right.variableEnvironment['x'].properties.clef).toEqual({
            line: 4,
            sign: 'F',
        });
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
        expect(result.right.variableEnvironment['x'].properties.clef).toEqual({
            line: 2,
            sign: 'G',
        });
    });
    it('be able to assign a multi-word property', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x.composer = Alex Hansen;
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
        expect(result.right.variableEnvironment['x'].properties).toHaveProperty('composer');
        expect(result.right.variableEnvironment['x'].properties.composer).toEqual('Alex Hansen');
    });
    it('be able to reassign a multi-word property', () => {
        let program = `
				fn main(): number {
								number x = 0;
								x.dynamic = mf;
								x.dynamic = f;
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
        expect(result.right.variableEnvironment['x'].properties.dynamic).toEqual('f');
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
        expect(steps.left.reason).toBe('Value "something invalid" is not a valid property value for property "clef".');
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
    it('should allow for reassignment of a specific index of a list', () => {
        let program = `
								fn main(): pitch {
												list number some_list = [1, 2, 3, 4];
												list number other_list =  [5, 6, 7, 8];
												list list number test_list = [some_list, other_list];
												test_list[0] = [9, 10, 11, 12];
												test_list[1].clef = alto;
												return c#4;
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

        expect(result.right.variableEnvironment['test_list'].value[0]).toEqual({
            returnType: 'list number',
            returnValue: [
                { returnType: 'number', returnValue: 9 },
                { returnType: 'number', returnValue: 10 },
                { returnType: 'number', returnValue: 11 },
                { returnType: 'number', returnValue: 12 },
            ],
        });
        expect(result.right.variableEnvironment['test_list'].value[1].properties).toHaveProperty('clef');
        expect(result.right.variableEnvironment['test_list'].value[1].properties.clef).toEqual({
            line: 3,
            sign: 'C',
        });
    });
    it('should allow for reassignment of a 2d list into a 3d list', () => {
        let program = `
								fn main(): pitch {
												list list list number some_nested_list = [[[1, 2], [3, 4]], [[5,6], [7, 8]]];
												list list number other_nested_list = [[5, 6], [7, 8]];
												some_nested_list[0] = other_nested_list;
												return c#4;
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

        expect(result.right.variableEnvironment['some_nested_list'].value[0].returnValue[0]).toEqual({
            returnType: 'list number',
            returnValue: [
                {
                    returnType: 'number',
                    returnValue: 5,
                },
                {
                    returnType: 'number',
                    returnValue: 6,
                },
            ],
        });
    });
    it('should allow for reassignment of a nested index of a list', () => {
        let program = `
								fn main(): pitch {
												list list number some_nested_list = [[1, 2], [3, 4]];
												list list number other_nested_list = [[5, 6], [7, 8]];
												list list list number test_list = [some_nested_list, other_nested_list];
												test_list[0][0] = [9, 10, 11, 12];
												test_list[1][0].clef = alto;
												return c#4;
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

        expect(result.right.variableEnvironment['test_list'].value[0].returnValue[0]).toEqual({
            returnType: 'list number',
            returnValue: [
                {
                    returnType: 'number',
                    returnValue: 9,
                },
                {
                    returnType: 'number',
                    returnValue: 10,
                },
                {
                    returnType: 'number',
                    returnValue: 11,
                },
                {
                    returnType: 'number',
                    returnValue: 12,
                },
            ],
        });
        expect(result.right.variableEnvironment['test_list'].value[1].returnValue[0].properties).toHaveProperty('clef');
        expect(result.right.variableEnvironment['test_list'].value[1].returnValue[0].properties.clef).toEqual({
            line: 3,
            sign: 'C',
        });
    });
    it('should allow for reassignment of a very nested index', () => {
        let program = `
								fn main(): pitch {
												list list list number some_nested_list = [[[1, 2], [3, 4]], [[5,6], [7, 8]]];
												some_nested_list[0][0][0] = 200;
												return c#4;
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

        expect(result.right.variableEnvironment['some_nested_list'].value[0].returnValue[0].returnValue[0]).toEqual({
            returnType: 'number',
            returnValue: 200,
        });
    });
    it('should allow for reassignment of a very nested index #2', () => {
        let program = `
								fn main(): pitch {
												list list list number some_nested_list = [[[1, 2], [3, 4]], [[5,6], [7, 8]]];
												some_nested_list[0][1][1] = 200;
												return c#4;
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

        expect(result.right.variableEnvironment['some_nested_list'].value[0].returnValue[1].returnValue[1]).toEqual({
            returnType: 'number',
            returnValue: 200,
        });
    });
    it('should allow for reassignment of an entire nested list', () => {
        let program = `
								fn main(): pitch {
												list list list number some_nested_list = [[[1, 2], [3, 4]], [[5,6], [7, 8]]];
												some_nested_list = [[[0],[0]], [[0],[0]]];
												return c#4;
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

        expect(result.right.variableEnvironment['some_nested_list']).toEqual({
            properties: {},
            value: [
                {
                    returnType: 'list list number',
                    returnValue: [
                        {
                            returnType: 'list number',
                            returnValue: [
                                {
                                    returnType: 'number',
                                    returnValue: 0,
                                },
                            ],
                        },
                        {
                            returnType: 'list number',
                            returnValue: [
                                {
                                    returnType: 'number',
                                    returnValue: 0,
                                },
                            ],
                        },
                    ],
                },
                {
                    returnType: 'list list number',
                    returnValue: [
                        {
                            returnType: 'list number',
                            returnValue: [
                                {
                                    returnType: 'number',
                                    returnValue: 0,
                                },
                            ],
                        },
                        {
                            returnType: 'list number',
                            returnValue: [
                                {
                                    returnType: 'number',
                                    returnValue: 0,
                                },
                            ],
                        },
                    ],
                },
            ],
            varType: 'list list list number',
        });
    });
    it('should typecheck within nested lists', () => {
        let program = `
								fn main(): pitch {
												list list list number some_nested_list = [[[1, 2], [3, 4]], [[5,6], [7, 8]]];
												some_nested_list[0][1][1] = c#4;
												return c#4;
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
            'Attempted to assign value of type "pitch" to variable "some_nested_list", which has type "number".',
        );
    });
});
