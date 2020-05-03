import { render } from '../../src/xml-renderer';
import { runtime } from '../../src/runtime';
import { tokenize } from '../../src/lexer/tokenizer';
import { makeSyntaxTree } from '../../src/lexer/parser';
import { isLeft } from 'fp-ts/lib/Either';

describe('2d list note renderer tests', () => {
    it('List list pitch: sample program #1', () => {
        let program = `
fn main(): list list pitch {
  list list pitch x = [
          [c#4 , c#4 , d4 , e4 ],
          [a4 , b4 , c4 , d4 ]
         ];

  x[0].part_id = part one;
  return x;
}`;
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
      <score-part id="part one">
        <part-name>part one</part-name>
      </score-part>
      <score-part id="P2">
        <part-name>P2</part-name>
      </score-part>
    </part-list>
    <part id="part one">
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
                    <octave>0</octave>
                </clef>
            </attributes>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>4</octave>
                    <alter>1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>4</octave>
                    <alter>1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>d</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>e</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
    </part>
    <part id="P2">
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
                    <octave>0</octave>
                </clef>
            </attributes>
            <note>
                <pitch>
                    <step>a</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>b</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>d</step>
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

    it('List list pitch: sample program #1', () => {
        let program = `fn main(): list list pitch {
  list list pitch x = [
          [c#4 , c#4 , d4 , e4 ],
          [a4 , b4 , c4 , d4 ],
          [c#3, d3, a7, Fb3]
         ];
  x[0].part_id = part one;
  x[1].part_id = yes this is a part id;
  x[1][0] = g4;
  x[2].clef = bass;
  x.key = E major;
  return x;
}`;
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
        expect(renderedXml).toBe(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.0">
    <part-list>
      <score-part id="part one">
        <part-name>part one</part-name>
      </score-part>
      <score-part id="yes this is a part id">
        <part-name>yes this is a part id</part-name>
      </score-part>
      <score-part id="P3">
        <part-name>P3</part-name>
      </score-part>
    </part-list>
    <part id="part one">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>4</fifths>
                    <mode>major</mode>
                </key>
                <time>
                    <beats>4</beats>
                    <beat-type>4</beat-type>
                </time>
                <clef>
                    <sign>G</sign>
                    <line>2</line>
                    <octave>0</octave>
                </clef>
            </attributes>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>4</octave>
                    <alter>1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>4</octave>
                    <alter>1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>d</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>e</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
    </part>
    <part id="yes this is a part id">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>4</fifths>
                    <mode>major</mode>
                </key>
                <time>
                    <beats>4</beats>
                    <beat-type>4</beat-type>
                </time>
                <clef>
                    <sign>G</sign>
                    <line>2</line>
                    <octave>0</octave>
                </clef>
            </attributes>
            <note>
                <pitch>
                    <step>g</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>b</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>d</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
    </part>
    <part id="P3">
        <measure number="1">
            <attributes>
                <divisions>144</divisions>
                <key>
                    <fifths>4</fifths>
                    <mode>major</mode>
                </key>
                <time>
                    <beats>4</beats>
                    <beat-type>4</beat-type>
                </time>
                <clef>
                    <sign>F</sign>
                    <line>4</line>
                    <octave>undefined</octave>
                </clef>
            </attributes>
            <note>
                <pitch>
                    <step>c</step>
                    <octave>3</octave>
                    <alter>1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>d</step>
                    <octave>3</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>a</step>
                    <octave>7</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>f</step>
                    <octave>3</octave>
                    <alter>-1</alter>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
    </part>
</score-partwise>`);
    });
});
