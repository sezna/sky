import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft, isRight } from 'fp-ts/lib/Either';
import { VariableDeclaration } from '../../src/lexer/variable-declaration';

// TODO test the lifting here
describe('Extra tests for literals', () => {
    it('Should tokenize numbers as numeric literals and evaluate them correctly', () => {
        let tokens = tokenize('number x = 20 + (10 - 4) * 3 - (2 * (1 - 4));');
        expect(tokens[3].tokenType).toBe('numeric-literal');
    });
    it('Should calculate the correct midi and pitch numbers', () => {
        let tokens = tokenize(`pitch x = a0;
pitch y = a#0;
pitch z = a#1;
pitch outofnames = c4;
											`);
        let stepsResult = makeSyntaxTree(tokens);
        if (isLeft(stepsResult)) {
            console.log('Error: ', stepsResult.left.reason);
            expect(true).toBe(false);
            return;
        }
        let steps = stepsResult.right;
        expect((steps[0] as any).varBody.literalValue.midiNumber).toBe(21);
        expect((steps[0] as any).varBody.literalValue.pitchNumber).toBe(0);
        expect((steps[1] as any).varBody.literalValue.midiNumber).toBe(22);
        expect((steps[1] as any).varBody.literalValue.pitchNumber).toBe(1);
        expect((steps[2] as any).varBody.literalValue.midiNumber).toBe(34);
        expect((steps[2] as any).varBody.literalValue.pitchNumber).toBe(13);
        expect((steps[3] as any).varBody.literalValue.midiNumber).toBe(60);
        expect((steps[3] as any).varBody.literalValue.pitchNumber).toBe(39);
    });
    it('Should reject an invalid pitch', () => {
        let tokens = tokenize(`pitch x = c0; -- there is no c0
											`);
        let stepsResult = makeSyntaxTree(tokens);
        expect(isLeft(stepsResult)).toBe(true);
        if (isRight(stepsResult)) {
            return;
        }
        expect(stepsResult.left.reason).toBe('Invalid pitch literal: c0 is not a valid pitch');
    });
    it('should correctly parse a list', () => {
        let tokens = tokenize(`list pitch x = [cn4, d4, c4, d4, c4, d4, d4, c4, d4,
						c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, 
						d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4, d4, c4];`);
        let stepsResult = makeSyntaxTree(tokens);
        if (isLeft(stepsResult)) {
            console.log('Error: ', stepsResult.left.reason);
            expect(true).toBe(false);
            return;
        }
        let steps = stepsResult.right;
        expect(steps[0]._type).toBe('VariableDeclaration');
        steps[0] = steps[0] as VariableDeclaration;
        expect(steps[0].varBody._type).toBe('LiteralExp');
        expect((steps[0].varBody as any).literalValue._type).toBe('LiteralList');
        expect((steps[0].varBody as any).literalValue.listContents).toHaveLength(44);
        expect((steps[0].varBody as any).literalValue.listContents[0]).toStrictEqual({
            _type: 'LiteralExp',
            literalValue: {
                _type: 'LiteralPitch',
                accidental: 'natural',
                midiNumber: 60,
                noteName: 'c',
                octave: 4,
                pitchNumber: 39,
                returnType: 'pitch',
                token: { tokenType: 'pitch-literal', value: { column: 17, line: 1, value: 'cn4' } },
            },
            returnType: 'pitch',
        });
        expect((steps[0].varBody as any).literalValue.listContents[1]).toStrictEqual({
            _type: 'LiteralExp',
            literalValue: {
                _type: 'LiteralPitch',
                accidental: undefined,
                midiNumber: 62,
                noteName: 'd',
                octave: 4,
                pitchNumber: 41,
                returnType: 'pitch',
                token: { tokenType: 'pitch-literal', value: { column: 22, line: 1, value: 'd4' } },
            },
            returnType: 'pitch',
        });
        expect((steps[0].varBody as any).literalValue.listContents[43]).toStrictEqual({
            _type: 'LiteralExp',
            literalValue: {
                _type: 'LiteralPitch',
                accidental: undefined,
                midiNumber: 60,
                noteName: 'c',
                octave: 4,
                pitchNumber: 39,
                returnType: 'pitch',
                token: { tokenType: 'pitch-literal', value: { column: 67, line: 3, value: 'c4' } },
            },
            returnType: 'pitch',
        });
    });
    it('should correctly parse a 2d list', () => {
        let tokens = tokenize(`list list pitch x = [[c4, d4, c4, d4, c4, d4, d4, c4, d4],
																												[a2, b2, c3, d3, e3, f3, g3, a3, b3],
																												[a2, b2, c3, d3, e3, f3, g3, a3, b3]];`);

        let stepsResult = makeSyntaxTree(tokens);
        if (isLeft(stepsResult)) {
            console.log('Error: ', stepsResult.left.reason);
            expect(true).toBe(false);
            return;
        }
        let steps = stepsResult.right;
        expect(steps[0]._type).toBe('VariableDeclaration');
        expect((steps[0] as any).varBody.literalValue.returnType).toBe('list list pitch');
        expect((steps[0] as any).varBody.literalValue.listContents[0].returnType).toBe('list pitch');
        expect((steps[0] as any).varBody.literalValue.listContents[1].returnType).toBe('list pitch');
        expect((steps[0] as any).varBody.literalValue.listContents[2].returnType).toBe('list pitch');
        expect((steps[0] as any).varBody.literalValue.listContents[0].literalValue.listContents[0].returnType).toBe(
            'pitch',
        );
    });
    it('should reject a 2d list declared with a 1d type', () => {
        let tokens = tokenize(`list pitch x = [[c4, d4, c4, d4, c4, d4, d4, c4, d4],
																												[a2, b2, c3, d3, e3, f3, g3, a3, b3],
																												[a2, b2, c3, d3, e3, f3, g3, a3, b3]];`);

        let stepsResult = makeSyntaxTree(tokens);
        if (isRight(stepsResult)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(stepsResult)).toBe(true);
        expect(stepsResult.left.reason).toBe(
            'Variable "x" is declared with type "list pitch" but the expression assigned to it returns type "list list pitch"',
        );
    });
    it('should reject a 1d list declared with a 2d type', () => {
        let tokens = tokenize(`list list pitch x = [c4, d4, c4, d4, c4, d4, d4, c4, d4];	`);

        let stepsResult = makeSyntaxTree(tokens);
        if (isRight(stepsResult)) {
            expect(true).toBe(false);
            return;
        }
        expect(isLeft(stepsResult)).toBe(true);
        expect(stepsResult.left.reason).toBe(
            'Variable "x" is declared with type "list list pitch" but the expression assigned to it returns type "list pitch"',
        );
    });
});
