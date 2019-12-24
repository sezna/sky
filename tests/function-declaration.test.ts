// Function declaration bodies are a little tricky so they get their own test file
import { tokenize } from '../src/lexer/tokenizer';
import { isRight, isLeft } from 'fp-ts/lib/Either';
import { makeSyntaxTree } from '../src/lexer/parser';

describe('Function Declaration tests', () => {
    it('Should be able to handle variable declarations and assignments', () => {
        // In order to make this test pass, I need to both implement
        // the new rhythm+pitch literals in variable declarations
        // and sort out the errors afterwards
        let functionDecl = `fn test_func(): number {
					pitch_rhythm first_note = c#2 quarter;
					pitch_rhythm second_note = Db1 dotted half;
					pitch third_note = ab1;
					number x = 2;
					degree_rhythm y = iii half;
					
					y = ii quarter;
					number z = x + 3;
					x = z;
          return 0;
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
        let functionDecl = `fn test_func(): number {
					fn inner_func(): number { return 0; }
          return 0;
				}`;
        let tokens = tokenize(functionDecl);
        let result = makeSyntaxTree(tokens);
        // If there was a parse error, print it out.
        if (isRight(result)) {
            console.log(result.right);
            return;
        }
        expect(isLeft(result)).toBe(true);
        expect(result.left.reason).toBe(
            'Unimplemented feature: fn (function-declaration) in this position is unimplemented',
        );
    });
    it('Should fail to parse an assignment inside of an if', () => {
        let functionDecl = `fn test_func(): number {
					number x = 0;
					if x == 2 then x = 1 else x = 3;
					number y = 1;
          return y;
				}`;
        let tokens = tokenize(functionDecl);
        let result = makeSyntaxTree(tokens);
        if (isRight(result)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(result)).toBe(true);
        expect(result.left.line).toBe(3);
        expect(result.left.column).toBe(23);
        expect(result.left.reason).toBe(
            'Unimplemented feature: = (assignment-operator) in this position is unimplemented',
        );
    });
    it('Should successfully parse if expressions in the function body', () => {
        let functionDecl = `fn test_func(): number {
					number x = 0;
					x = if x == 2 then 1 else 3;
					number y = 1;
          return y;
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
