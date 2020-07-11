import compile from '../../src/main';
describe('Simple program tests', () => {
    it('Should compile a simple program with only one line', () => {
        compile('fn main(): number { return 5; }');
    });
    it('Should compile the first half of twinkle twinkle little star', () => {
        expect(
            (compile(
                'fn main(): list pitch_rhythm { return [d4 quarter, d4 quarter, a4 quarter, a4 quarter, b4 quarter, b4 quarter, a4 half]; }',
            ) as any).renderedXml,
        ).toBe(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
                    <step>D</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
            </note>
            <note>
                <pitch>
                    <step>D</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
            </note>
            <note>
                <pitch>
                    <step>A</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
            </note>
            <note>
                <pitch>
                    <step>A</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
            </note>
        </measure>
        <measure number="2">
            <note>
                <pitch>
                    <step>B</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
            </note>
            <note>
                <pitch>
                    <step>B</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
            </note>
            <note>
                <pitch>
                    <step>A</step>
                    <octave>4</octave>
                </pitch>
                <duration>288</duration>
            </note>
        </measure>
    </part>
</score-partwise>`);
    });
    it('should compile a chord in a list', () => {
        let prog = `fn main(): list pitch_rhythm {
--  pitch_rhythm my_chord = ;
  return [\\d4, f#4, a4\\ quarter, d4 quarter, a4 quarter, a4 quarter,
          b4 quarter, b4 quarter, a4 half]; 
}`;
        let res = compile(prog);
        if (res.isOk === false) {
            console.log(JSON.stringify(res.err));
        }
        expect(res.isOk).toBe(true);
    });
    it('shouldnt duplicate the first dynamic', () => {
        let prog = `fn main(): list list pitch_rhythm {
  pitch_rhythm my_chord = \\d4, f#4, a4\\ quarter;
  list list pitch_rhythm to_return = [[my_chord, d4 quarter, a4 quarter, a4 quarter,
          b4 quarter, b4 quarter, a4 half],
          [d3 whole, b3 half, a3 half]
         ]; 
   to_return[0][0].dynamic = f;
   to_return[1].clef = bass;
   return to_return;
}  `;
        let res = compile(prog);
        if (res.isOk === false) {
            console.log(JSON.stringify(res.err));
            expect(true).toBe(false);
            return;
        }
        expect(res.isOk).toBe(true);
        // there should only be 1 forte dynamic
        expect(res.renderedXml.split('<f/>').length - 1).toBe(1);
    });

    it('shouldnt omit a note in the chord', () => {
        let prog = `fn main(): list pitch_rhythm {
  return [\\d4, f#4, c#3, a4\\ quarter, d4 quarter]; 
}`;
        let res = compile(prog);
        if (res.isOk === false) {
            console.log(JSON.stringify(res.err));
            expect(true).toBe(false);
            return;
        }
        expect(res.isOk).toBe(true);
        // the final note in the chord should not be omitted when parsed in a list
        expect(res.renderedXml.split('<step>A</step>').length - 1).toBe(1);
    });
    it('should pass params down into a function', () => {
        let prog = `fn pitch_to_rhythm(olo: pitch): pitch_rhythm {
   pitch_rhythm z = if 5 == 5 then olo quarter else c#4 quarter;
   return z;
   }`;
        let res = compile(prog);
        if (res.isOk === false) {
            console.log(JSON.stringify(res.err));
            expect(true).toBe(false);
            return;
        }
        expect(res.isOk).toBe(true);
    });
});
