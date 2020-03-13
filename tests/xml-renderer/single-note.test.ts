import { render } from '../../src/xml-renderer';
import { runtime } from '../../src/runtime';
import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

describe('single note renderer tests', () => {
    it('Should be able to render a c4, and the default rhythm should be a quarter note', () => {
        let program = `fn main(): pitch { return c4; }`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(`Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}`);
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedXml = render(runtimeResult.right);
        expect(renderedXml).toBe(
            `<note>
  <pitch>
    <step>c</step>
    <octave>4</octave>
    <duration>1</duration>
  </pitch>
</note>`,
        );
    });
    it('Should be able to render an A#3, and the default rhythm should be a quarter note', () => {
        let program = `fn main(): pitch { return a#3; }`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(`Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}`);
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedXml = render(runtimeResult.right);
        expect(renderedXml).toBe(
            `<note>
  <pitch>
    <step>a</step>
    <octave>3</octave>
    <duration>1</duration>
    <alter>sharp</alter>
  </pitch>
</note>`,
        );
    });
    it('Should be able to render a Gb5, and the default rhythm should be a quarter note', () => {
        let program = `fn main(): pitch { return Gb5; }`;
        let stepsResult = makeSyntaxTree(tokenize(program));
        if (isLeft(stepsResult)) {
            console.log(`Parse error at line ${stepsResult.left.line}, column ${stepsResult.left.column}`);
            expect(true).toBe(false);
            return;
        }
        let runtimeResult = runtime(stepsResult.right);
        if (isLeft(runtimeResult)) {
            console.log(`Runtime error: ${runtimeResult.left.reason}`);
            expect(true).toBe(false);
            return;
        }

        let renderedXml = render(runtimeResult.right);
        expect(renderedXml).toBe(
            `<note>
  <pitch>
    <step>g</step>
    <octave>5</octave>
    <duration>1</duration>
    <alter>flat</alter>
  </pitch>
</note>`,
        );
    });
});
