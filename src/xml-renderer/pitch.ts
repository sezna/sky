import { RuntimeOutput } from '../runtime';
import { calculateDuration } from './utils';
import { LiteralRhythm } from '../lexer/expression/literal';

const divisions = 144;

interface PitchRenderResult {
    output: string;
    timeNumerator: number;
    timeDenominator: number;
    beatsThusFar: number;
    measureNumber: number;
}

export function renderPitch(
    input: RuntimeOutput['mainReturn'],
    duration?: LiteralRhythm,
    status = {
        output: '',
        timeNumerator: 4,
        timeDenominator: 4,
        beatsThusFar: 0,
        measureNumber: 1,
    },
): PitchRenderResult {
    let { timeNumerator, timeDenominator, beatsThusFar, measureNumber } = status;
    let newMeasureText = ``;
    let closingMeasureText = ``;
    let fifths = (input.properties && input.properties.key && (input.properties.key as any).keyData?.fifths) || 0;
    let mode = (input.properties && input.properties.key && (input.properties.key as any).quality) || 'major';
    let { sign, line, octave } = (input.properties && (input.properties.clef as any)) || {
        sign: 'G',
        line: '2',
        octave: 0,
    };
    let addAttributes = false;
    // Check if this is the first measure
    if (measureNumber === 1 && beatsThusFar === 0) {
        if (input.properties && input.properties.time) {
            let [num, denom] = input.properties.time as any; //as [number, number]; // this is definitely [number, number]. TODO figure out how to type this
            timeNumerator = num;
            timeDenominator = denom;
        }
        newMeasureText = `
        <measure number="${measureNumber}">
            <attributes>
                <divisions>144</divisions>
                <clef>
                    <sign>${sign}</sign>
                    <line>${line}</line>
                    <octave>${octave}</octave>
                </clef>
                <key>
                  <fifths>${fifths}</fifths>
                  <mode>${mode}</mode>
                </key>
                <time>
                    <beats>${timeNumerator}</beats>
                    <beat-type>${timeDenominator}</beat-type>
                </time>
            </attributes>
`;
    } else if (beatsThusFar === 0) {
        // Check if this is the first beat

        newMeasureText = `
        <measure number="${measureNumber}">
`;
    }
    let newKeyText = '';
    // Check if this note contains a key signature change
    if (input.properties && input.properties.key) {
        let keyProperties = input.properties.key as any; // TODO discriminated union thing
        let fifths = keyProperties.keyData.fifths;
        let mode = keyProperties.quality;

        if (beatsThusFar !== 0) {
            // TODO column and line
            console.warn(
                `Key signature "${keyProperties.tonic} ${mode}" in measure ${measureNumber} may not be rendered because it does not fall on a new measure.`,
            );
        }
        newKeyText = `
          <key>
            <fifths>${fifths}</fifths>
            <mode>${mode}</mode>
          </key>
`;
        addAttributes = true;
    }

    let newClefText = '';
    // check if this note contains a clef change
    if (input.properties && input.properties.clef) {
        let { sign, line, octave } = input.properties.clef as any;
        newClefText = `
                <clef>
                    <sign>${sign}</sign>
                    <line>${line}</line>
                    <octave>${octave}</octave>
                </clef>
`;
        if (beatsThusFar !== 0) {
            // TODO column and line
            console.warn(
                `Clef change in measure ${measureNumber} may not be rendered because it does not fall on a new measure.`,
            );
        }
        addAttributes = true;
    }

    // Check if this note contains a time signature change, which forces the previous bar to end.
    if (input.properties && input.properties.time) {
        let [num, denom] = input.properties.time as any; //as [number, number]; // this is definitely [number, number]. TODO figure out how to type this
        if (timeNumerator !== num || timeDenominator !== denom) {
            if (beatsThusFar !== divisions * timeNumerator) {
                console.warn('Changed time signatures before previous measure was complete.'); // TODO symbol location
            }
            measureNumber += 1;
            beatsThusFar = 0;
            timeNumerator = num;
            timeDenominator = denom;
            // TODO any note-level properties that apply to measures would be assigned here
            newMeasureText = `
        <measure number="${measureNumber}">
            <attributes>${newKeyText}${newClefText}
                <divisions>144</divisions>
                <time>
                    <beats>${timeNumerator}</beats>
                    <beat-type>${timeDenominator}</beat-type>
                </time>
            </attributes>
`;
            closingMeasureText = `        </measure>`;
        }
    }

    // Check if this beat is the end of the measure.
    // Default to 1 beat.
    let numBeats = 1;
    if (duration !== undefined) {
        numBeats = calculateDuration(duration, divisions);
    }

    beatsThusFar += numBeats;

    // New measure
    if (beatsThusFar >= divisions * timeNumerator) {
        if (beatsThusFar > divisions * timeNumerator) {
            console.warn('Measure did not line up with time signature. Excess beats.'); // TODO symbol location
        }
        measureNumber += 1;
        beatsThusFar = 0;
        closingMeasureText = `        </measure>`;
    }

    let output = `${newMeasureText}            <note>
                <pitch>
                    <step>${input.returnValue.noteName}</step>
                    <octave>${input.returnValue.octave}</octave>
`;

    if (input.returnValue.accidental) {
        // MusicXml uses -1 to represent flats, +1 to represent sharps, +n/-n to support multiple
        // sharps/flats and supports decimals.
        // https://usermanuals.musicxml.com/MusicXML/Content/EL-MusicXML-alter.htm
        // TODO microtones and double sharp/flat
        let alterTagContent = 0;
        switch (input.returnValue.accidental) {
            case 'flat':
                alterTagContent = -1;
                break;
            case 'sharp':
                alterTagContent = 1;
                break;
        }
        output += `                    <alter>${alterTagContent}</alter>\n`;
    }

    output =
        output +
        `                </pitch>
${
    input.returnValue.rhythmName ? `            <type>${input.returnValue.rhythmName}</type>\n` : ``
}                <duration>${numBeats}</duration>
                <type>${duration ? (duration.isDotted ? 'dotted ' : '') + duration.rhythmName : 'quarter'}</type>
            </note>
${closingMeasureText}`;

    return {
        output,
        timeDenominator,
        timeNumerator,
        beatsThusFar,
        measureNumber,
    };
}
