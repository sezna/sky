import { render } from '../../src/xml-renderer';
import { runtime } from '../../src/runtime';
import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

describe('list of notes XML renderer tests', () => {
    it('Should be able to render a c4, and the default rhythm should be a quarter note', () => {
        let program = `fn main(): list pitch { return) [c4, d4, e4, f4]; }`;
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
            `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
    <part-list>
    <score-part id="P1">
        <part-name>P1</part-name>
    </score-part>
    </part-list>
    <part id="P1">
        <measure number="1">
            <attributes>
                <divisions>1</divisions>
                <key>
                    <fifths>0</fifths>
                </key>
                <time>
                    <beats>4</beats>
                    <beat-type>4</beat-type>
                </time>
                <clef>
                    <sign>G</sign>
                    <line>2</line>
                </clef>
            </attributes>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>4</octave>
                </pitch>
                <duration>1</duration>
                <type>quarter</type>
            </note>
        <note>
            <pitch>
                <step>d</step>
                <octave>4</octave>
            </pitch>
            <duration>1</duration>
            <type>quarter</type>
        </note>
        <note>
            <pitch>
                <step>e</step>
                <octave>4</octave>
            </pitch>
            <duration>1</duration>
            <type>quarter</type>
        </note>
        <note>
            <pitch>
                <step>f</step>
                <octave>4</octave>
            </pitch>
            <duration>1</duration>
            <type>quarter</type>
        </note>
        </measure>
    </part>
</score-partwise>`,
        );
    });
});
