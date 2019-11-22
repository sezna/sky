// Function declaration bodies are a little tricky so they get their own test file
import { tokenize } from '../src/lexer/tokenizer';
import { isRight, isLeft } from 'fp-ts/lib/Either';
import { makeSyntaxTree } from '../src/lexer/parser';
import { FunctionDeclaration } from '../src/lexer/function-declaration';

describe('Function Declaration tests', () => {
    it('Should be able to parse empty-bodied functions', () => {
        let functionDecl = `fn test_func(): song {

				}`;
        let tokens = tokenize(functionDecl);
        let result = makeSyntaxTree(tokens);
        // If there was a parse error, print it out.
        if (isLeft(result)) {
            console.log(result.left);
            return;
        }
        expect(isRight(result)).toBe(true);
        expect((result.right[0] as FunctionDeclaration)._type).toBe('FunctionDeclaration');
        expect((result.right[0] as FunctionDeclaration).body).toHaveLength(0);
    });
    it('Should be able to handle variable declarations and assignments', () => {
        // In order to make this test pass, I need to both implement
        // the new rhythm+pitch literals in variable declarations
        // and sort out the errors afterwards
        let functionDecl = `fn test_func(): song {
					note first_note = c#2 quarter;
					note second_note = Db1 dotted half;
					note third_note = ab1;
					number x = 2;
					degree y = iii half;
					
					y = 10;
					number z = y + x;
					x = z;
				}`;
        let tokens = tokenize(functionDecl);
        let result = makeSyntaxTree(tokens);
        // If there was a parse error, print it out.
        if (isLeft(result)) {
            console.log(result.left);
        }
        expect(isRight(result)).toBe(true);
    });
    it('Should not allow nested function declarations', () => {
        let functionDecl = `fn test_func(): song {
					fn inner_func(): number {}
				}`;
        let tokens = tokenize(functionDecl);
        let result = makeSyntaxTree(tokens);
        // If there was a parse error, print it out.
        if (isRight(result)) {
            console.log(result.right);
            return;
        }
        expect(isLeft(result)).toBe(true);
    });
    it('Should fail to parse an assignment inside of an if', () => {
        let functionDecl = `fn test_func(): song {
					number x = 0;
					if x == 2 then x = 1 else x = 3;
					number y = 1;
				}`;
        let tokens = tokenize(functionDecl);
        let result = makeSyntaxTree(tokens);
        if (isRight(result)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(result)).toBe(true);
    });
    it('Should successfully parse if expressions in the function body', () => {
        let functionDecl = `fn test_func(): song {
					number x = 0;
					x = if x == 2 then 1 else 3;
					number y = 1;
				}`;
        let tokens = tokenize(functionDecl);
        let result = makeSyntaxTree(tokens);
        // If there was a parse error, print it out.
        if (isLeft(result)) {
            console.log(result.left);
            expect(true).toBe(false);
            return;
        }
        expect(isRight(result)).toBe(true);
    });
});
