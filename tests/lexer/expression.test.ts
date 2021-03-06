import { tokenize } from '../../src/lexer/tokenizer';
//import { parseExpression } from './expression';
import { variableDeclaration } from '../../src/lexer/variable-declaration';
import { isRight, isLeft } from 'fp-ts/lib/Either';
import { makeSyntaxTree } from '../../src/lexer/parser';

describe('Expression parsing tests', () => {
    it('Should not throw an error when parsing a valid expression #1', () => {
        let tokens = tokenize('number x = 20 + (10 - 4) * 3 - (2 * (1 - 4));');
        let result = variableDeclaration(tokens, [], [], []);
        // If there was a parse error, print it out.
        if (isLeft(result)) {
            console.log(result.left);
        }
        expect(isRight(result)).toBe(true);
    });
    it('Should not throw an error when parsing a valid expression #2', () => {
        let tokens = tokenize('number z = (10 - (10 - (10 - (10))));');
        let result = variableDeclaration(tokens, [], [], []);
        if (isLeft(result)) {
            console.log(result.left);
        }
        expect(isRight(result)).toBe(true);
    });
    it('Should throw an error when parsing an invalid expression #1', () => {
        let tokens = tokenize('number z = ;');
        let result = variableDeclaration(tokens, [], [], []);
        expect(isLeft(result)).toBe(true);
    });
    it('Should throw an error when parsing an invalid expression #2', () => {
        let tokens = tokenize('number z = ( 10');
        let result = variableDeclaration(tokens, [], [], []);
        expect(isLeft(result)).toBe(true);
    });
    it('Should throw an error when parsing an invalid expression #3', () => {
        let tokens = tokenize('number z = 10 + 10');
        let result = variableDeclaration(tokens, [], [], []);
        expect(isLeft(result)).toBe(true);
    });
    it('Should throw an error when parsing an invalid expression #3', () => {
        let tokens = tokenize('note z = ');
        let result = variableDeclaration(tokens, [], [], []);
        expect(isLeft(result)).toBe(true);
    });
    it('Should be able to handle inline if expressions', () => {
        let tokens = tokenize('number x = if 2 < 5 then 10 else 0;');
        let result = variableDeclaration(tokens, [], [], []);
        if (isLeft(result)) {
            console.log(result.left);
        }
        expect(isRight(result)).toBe(true);
    });
    it('Should be able to parse function applications inside of expressions', () => {
        let tokens = tokenize(
            'fn foo(a: number, b: number, c: number): number { return a + b + c;}; number x = 10 + foo(1, 2, 3);',
        );
        let result = makeSyntaxTree(tokens);
        if (isLeft(result)) {
            console.log(result.left);
        }
        expect(isRight(result)).toBe(true);
    });
    /*
    it('Should throw an error if a variable is already declared with the same name', () => {
        let tokens = tokenize('number x = 0; number x = 2;');
        let result = makeSyntaxTree(tokens);
        expect(isLeft(result)).toBe(true);
    });
    it('Should throw an error if a function is already declared with the same name', () => {
        let tokens = tokenize(`fn foo(): song { 
                                    number x = 10;        
                                  };
                                  fn foo(): number {
                                    number z = 20; 
                                  };`);
        let result = makeSyntaxTree(tokens);
        expect(isLeft(result)).toBe(true);
    });
    it('Should throw an error if a function name conflicts with a variable name', () => {
        let tokens = tokenize(`number foo = 20;
                                  fn foo(): number {
                                    number z = 20; 
                                  };`);
        let result = makeSyntaxTree(tokens);
        expect(isLeft(result)).toBe(true);
    });
    it('Should throw an error if a variable name conflicts with a function name', () => {
        let tokens = tokenize(`fn foo(): number {
                                    number z = 20; 
                                  };
                                  number foo = 20;`);
        let result = makeSyntaxTree(tokens); //(tokens, [], []);
        expect(isLeft(result)).toBe(true);
    });
    it('Should be able to parse lists', () => {
        let tokens = tokenize(`list x = [c4, a4, d4, c#4];`);
        let result = makeSyntaxTree(tokens); //(tokens, [], []);
        if (isLeft(result)) {
            console.log('Error: ', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(isRight(result)).toBe(true);
    });
  */
});
