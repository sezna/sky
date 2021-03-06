import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isRight, isLeft } from 'fp-ts/lib/Either';

describe('Invalid ops tests', () => {
    /* If you can think of any invalid operations not already expressed
     * here, please add a test!
     */
    it('Multiplying two scale degrees should fail', () => {
        let tokens = tokenize('degree x = iv; degree y = i; degree z = x * y;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Dividing two scale degrees should fail', () => {
        let tokens = tokenize('degree x = iv; degree y = i; degree z = x / y;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail #1', () => {
        let tokens = tokenize('number x = 10; number y = 2; boolean z = false; number a = (x + y) - z;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail #2', () => {
        let tokens = tokenize('number x = 10; number y = 2; boolean z = false; number a = (x + y - z);');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            console.log(JSON.stringify(steps.right, null, 2));
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail #3', () => {
        let tokens = tokenize('number x = 10; number y = 2; boolean z = false; number a = y - z;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Operating numbers with booleans should fail with literals', () => {
        let tokens = tokenize('number z = false + 3;');
        let steps = makeSyntaxTree(tokens);
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Should not allow values of the wrong type to be assigned to a variable', () => {
        let program = `fn main(): number { 
          number x = 3;
          x = c#4;
          return 0;
        }`;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            'Attempted to assign value of type "pitch" to variable "x", which has type "number".',
        );
    });
    it('an incorrect typename should fail', () => {
        let program = `fn main(): number { degree x = iii; degree y = ii; number z = x + y; return 0; }`;
        let steps = makeSyntaxTree(tokenize(program));
        expect(isLeft(steps)).toBe(true);
    });
});

describe('If expression typechecking', () => {
    it('Should not allow an if expression which returns two different types from its branches', () => {
        let program = `fn main(): number { number x = if true then 5 else false; return 0; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            'Branches of if expression do not return the same type. The "then" branch returns type number but the "else" branch returns type boolean',
        );
    });
    it('Should not allow an if expression which returns a different type than the declaration of the variable', () => {
        let program = `fn main(): number { number x = if true then c#4 else d#4; return 0; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
    it('Should allow an if expression result to be assigned to a variable', () => {
        let program = `fn main(): number { number x = if 3 < 5 then 3 else 5; return 0; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Error: ', steps.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(isRight(steps)).toBe(true);
    });
    it('Should allow an if expression result to be not assigned to a variable', () => {
        let program = `fn main(): number { if 3 < 5 then 3 else 5; return 0; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Error: ', steps.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(isRight(steps)).toBe(true);
    });
    it('Should not allow an if expression condition to be non-boolean', () => {
        let program = `fn main(): number { if 5 then 3 else 5; return 0; }`;

        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
    });
});

describe('function application typechecking', () => {
    it('should reject a function that returns the wrong type', () => {
        let program = `
    fn other_func(): number {
       return c#3; -- this mismatch should get caught
    }

    fn main(): number {
      pitch x = other_func();
      return 0;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            `Function "other_func" is declared to return a value of type "number" but actually returns type "pitch"`,
        );
    });
    it('should reject a function in an assignment that returns the wrong type', () => {
        let program = `
    fn other_func(): number {
       return 10;
    }

    fn main(): number{
      pitch x = other_func(); --this mismatch should get caught
      return 0;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            `Variable "x" is declared with type "pitch" but the expression assigned to it returns type "number"`,
        );
    });
    it('should reject a function in an operation that returns the wrong type #1', () => {
        let program = `
    fn other_func(): number {
       return 10;
    }
    
    fn main(): number {
      number result = C#1 + other_func();
      return 0;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe('Operator + is not implemented for type "pitch" and "number"');
    });
    it('should reject a function in an operation that returns the wrong type #2', () => {
        let program = `
    fn other_func(): number {
       return 10;
    }

    fn main(): number {
      pitch result = C#1 + other_func();
      return 0;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe('Operator + is not implemented for type "pitch" and "number"');
    });
    it("Should reject a function which doesn't return anything", () => {
        let program = `fn main(): number { --the lack of "number" return should get caught
      pitch result = C#1;
      return false;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            'Function "main" is declared to return a value of type "number" but actually returns type "boolean"',
        );
    });
    it('Should identify in a complicated expression an invalid function application type', () => {
        let program = `
    fn other_func(): boolean {
       return false;
    }

    fn main(): pitch { --the lack of "pitch" return should get caught
      number x = 10;
      number y = 20;
      number z = (1 + x) - (3 * y * x) + (x - other_func());
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe('Operator - is not implemented for type "number" and "boolean"');
    });
    it('Should allow a valid function call in a complicated operation', () => {
        let program = `
    fn other_func(): number {
       return 10;
    }

    fn main(): number { --the lack of "song" return should get caught
      number x = 10;
      number y = 20;
      number z = (1 + x) - (3 * y * x) + (x - other_func());
      return 0;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Error: ', steps.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(isRight(steps)).toBe(true);
    });
});
describe('Complicated literals typechecking', () => {
    it('Should know the type of a nested list literal expression', () => {
        let program = `
    fn main(): number { 
      list list number x = [[1,2,3,4,5,6]];
      return 0;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isLeft(steps)) {
            console.log('Error: ', steps.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(isRight(steps)).toBe(true);
    });
    it('Should reject an incorrectly typed nested list literal expression', () => {
        let program = `
    fn main(): number { 
      list number x = [[1,2,3,4,5,6]];
      return 0;
    }
    `;
        let steps = makeSyntaxTree(tokenize(program));
        if (isRight(steps)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(steps)).toBe(true);
        expect(steps.left.reason).toBe(
            'Variable "x" is declared with type "list number" but the expression assigned to it returns type "list list number"',
        );
    });
});
