import { runtime } from '../../src/runtime';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { tokenize } from '../../src/lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';

describe('pitch operator tests', () => {
    it('should be able to add two pitches', () => {
        let tokens = tokenize(`fn main(): list pitch {
				pitch first = A#2; 
				pitch second = b0;
        list pitch third = first + second; 
        return third;
			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(result.right.mainReturn.returnType).toBe('list pitch');
        expect(result.right.mainReturn.returnValue[0].pitches[0].noteName).toBe('a');
        expect(result.right.mainReturn.returnValue[0].pitches[0].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[0].pitches[0].octave).toBe(2);
        expect(result.right.mainReturn.returnValue[1].pitches[0].noteName).toBe('b');
        expect(result.right.mainReturn.returnValue[1].pitches[0].accidental).toBe(undefined);
        expect(result.right.mainReturn.returnValue[1].pitches[0].octave).toBe(0);
    });

    it('Should be able to add a pitch into a list pitch of pitches', () => {
        let tokens = tokenize(`fn main(): list pitch {
				pitch first = A#2; 
				pitch second = b0; 
				list pitch third = first + second; 
				list pitch fourth = third + c#2;
        return fourth;
			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(result.right.mainReturn.returnType).toBe('list pitch');
      let resWithoutVarEnv = { ...result.right.mainReturn.returnValue[2], variableEnvironment: [] };
      console.log(JSON.stringify(resWithoutVarEnv, null, 2));
        expect(result.right.mainReturn.returnValue[2].pitches[0].noteName).toBe('c');
        expect(result.right.mainReturn.returnValue[2].pitches[0].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[2].pitches[0].octave).toBe(2);
    });
    it('should not be able to subtract two pitches', () => {
        let tokens = tokenize(`fn main(): number {
				pitch first = F6; 
				pitch second = b0;
				pitch third = first - second;
        return 0;
			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }
        let result = runtime(steps.right);
        expect(isLeft(result)).toBe(true);
    });
    it('Should be able to add a chord into a list pitch of pitches', () => {
        let tokens = tokenize(`fn main(): list pitch {
				pitch first = A#2; 
				pitch second = b0; 
				list pitch third = first + second; 
                list pitch fourth = third + \\c#2, e3, g#4\\;
        return fourth;
			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        expect(result.right.mainReturn.returnType).toBe('list pitch');
        expect(result.right.mainReturn.returnValue[2].pitches[0].noteName).toBe('c');
        expect(result.right.mainReturn.returnValue[2].pitches[0].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[2].pitches[0].octave).toBe(2);
        expect(result.right.mainReturn.returnValue[2].pitches[1].noteName).toBe('e');
        expect(result.right.mainReturn.returnValue[2].pitches[1].accidental).toBe(undefined);
        expect(result.right.mainReturn.returnValue[2].pitches[1].octave).toBe(3);
        expect(result.right.mainReturn.returnValue[2].pitches[2].noteName).toBe('g');
        expect(result.right.mainReturn.returnValue[2].pitches[2].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[2].pitches[2].octave).toBe(4);
    });
    it('Should be able to put a chord inside of a chord', () => {
        let tokens = tokenize(`fn main(): list pitch {
				pitch first = \\A#2, C#3\\; 
				pitch second = \\b5, first\\; -- ideally this flattens out into the chord 
                list pitch third = second + \\c#2, e3, g#4\\;
        return third;
			 }`);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        // console.log(JSON.stringify(variableEnvironment['third'], null, 2));
        expect(result.right.mainReturn.returnType).toBe('list pitch');
        expect(result.right.mainReturn.returnValue[0].pitches[0].noteName).toBe('b');
        expect(result.right.mainReturn.returnValue[0].pitches[0].accidental).toBe(undefined);
        expect(result.right.mainReturn.returnValue[0].pitches[0].octave).toBe(5);
        expect(result.right.mainReturn.returnValue[0].pitches[1].noteName).toBe('a');
        expect(result.right.mainReturn.returnValue[0].pitches[1].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[0].pitches[1].octave).toBe(2);
        expect(result.right.mainReturn.returnValue[0].pitches[2].noteName).toBe('c');
        expect(result.right.mainReturn.returnValue[0].pitches[2].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[0].pitches[2].octave).toBe(3);
        expect(result.right.mainReturn.returnValue[1].pitches[0].noteName).toBe('c');
        expect(result.right.mainReturn.returnValue[1].pitches[0].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[1].pitches[0].octave).toBe(2);
    });
    it('Should reject a chord that is missing commas', () => {
        let tokens = tokenize(`fn main(): number {
				pitch first = \\A#2 C#3\\; 
				pitch second = \\b5 first\\; -- ideally this flattens out into the chord 
                list pitch third = second + \\c#2 e3 g#4\\;
        return 0;
			 }`);
        let steps = makeSyntaxTree(tokens);
        expect(isLeft(steps)).toBe(true);
    });
    it('Should be able to put a function which returns a chord inside of a chord', () => {
        let tokens = tokenize(`
        fn returnsChord(): pitch {
            return \\b5\\;
        }
        
        fn main(): list pitch {
              pitch first = \\A#2, C#3\\; 
              pitch second = \\returnsChord(), first\\; 
              list pitch third = second + \\c#2, e3, g#4\\;
              return third;
        }
        `);
        let steps = makeSyntaxTree(tokens);
        if (isLeft(steps)) {
            console.log('Steps are', JSON.stringify(steps, null, 2));
            expect(true).toBe(false);
            return;
        }

        let result = runtime(steps.right);
        if (isLeft(result)) {
            console.log('Result is', result.left.reason);
            expect(true).toBe(false);
            return;
        }
        // console.log(JSON.stringify(variableEnvironment['third'], null, 2));
        expect(result.right.mainReturn.returnType).toBe('list pitch');
        expect(result.right.mainReturn.returnValue[0].pitches[0].noteName).toBe('b');
        expect(result.right.mainReturn.returnValue[0].pitches[0].accidental).toBe(undefined);
        expect(result.right.mainReturn.returnValue[0].pitches[0].octave).toBe(5);
        expect(result.right.mainReturn.returnValue[0].pitches[1].noteName).toBe('a');
        expect(result.right.mainReturn.returnValue[0].pitches[1].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[0].pitches[1].octave).toBe(2);
        expect(result.right.mainReturn.returnValue[0].pitches[2].noteName).toBe('c');
        expect(result.right.mainReturn.returnValue[0].pitches[2].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[0].pitches[2].octave).toBe(3);
        expect(result.right.mainReturn.returnValue[1].pitches[0].noteName).toBe('c');
        expect(result.right.mainReturn.returnValue[1].pitches[0].accidental).toBe('sharp');
        expect(result.right.mainReturn.returnValue[1].pitches[0].octave).toBe(2);
    });
});
