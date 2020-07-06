import compile from '../../src/main';
describe('Simple program tests', () => {
    it('Should compile a simple program with only one line', () => {
        compile('fn main(): number { return 5; }');
    });
    it('Should compile the first half of twinkle twinkle little star', () => {
        expect(
            compile(
                'fn main(): list pitch_rhythm { return [d4 quarter, d4 quarter, a4 quarter, a4 quarter, b4 quarter, b4 quarter, a4 half]; }',
            ),
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
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>D</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>A</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>A</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
        </measure>
        <measure number="2">
            <note>
                <pitch>
                    <step>B</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>B</step>
                    <octave>4</octave>
                </pitch>
                <duration>144</duration>
                <type>quarter</type>
            </note>
            <note>
                <pitch>
                    <step>A</step>
                    <octave>4</octave>
                </pitch>
                <duration>288</duration>
                <type>half</type>
            </note>
        </measure>
    </part>
</score-partwise>`);
    });
});
