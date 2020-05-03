import { render } from '../../src/xml-renderer';
import { runtime } from '../../src/runtime';
import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

describe('single note XML renderer tests', () => {
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
            `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
    <part-list>
        <score-part id="P1">
            <part-name>Part 1</part-name>
        </score-part>
    </part-list>
    <part id="P1">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>0</fifths>
                    <mode>major</mode>
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
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
    </part>
</score-partwise>`,
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
            `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
    <part-list>
        <score-part id="P1">
            <part-name>Part 1</part-name>
        </score-part>
    </part-list>
    <part id="P1">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>0</fifths>
                    <mode>major</mode>
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
                    <step>a</step>
                    <octave>3</octave>
                    <alter>1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
    </part>
</score-partwise>`,
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
            `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
    <part-list>
        <score-part id="P1">
            <part-name>Part 1</part-name>
        </score-part>
    </part-list>
    <part id="P1">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>0</fifths>
                    <mode>major</mode>
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
                    <step>g</step>
                    <octave>5</octave>
                    <alter>-1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
    </part>
</score-partwise>`,
        );
    });
    it('Should be able to render a pitch with a rhythm - Bb5 half', () => {
        let program = `fn main(): pitch_rhythm { return Bb5 half; }`;
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
            <part-name>Part 1</part-name>
        </score-part>
    </part-list>
    <part id="P1">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>0</fifths>
                    <mode>major</mode>
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
                    <step>B</step>
                    <octave>5</octave>
                    <alter>-1</alter>
                </pitch>
                <duration>288</duration>
                <type>half</type>
            </note>
        </measure>
    </part>
</score-partwise>`,
        );
    });
    it('Should be able to render a pitch with a rhythm - G#7 dotted half', () => {
        let program = `fn main(): pitch_rhythm { return g#7 dotted half; }`;
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
            <part-name>Part 1</part-name>
        </score-part>
    </part-list>
    <part id="P1">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>0</fifths>
                    <mode>major</mode>
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
                    <step>g</step>
                    <octave>7</octave>
                    <alter>1</alter>
                </pitch>
                <duration>432</duration>
                <type>dotted half</type>
            </note>
        </measure>
    </part>
</score-partwise>`,
        );
    });
});
