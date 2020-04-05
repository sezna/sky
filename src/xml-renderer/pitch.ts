import { RuntimeOutput } from '../runtime';
import { timeSignatureDurationMapping } from './utils';
import { LiteralRhythm } from '../lexer/expression/literal';
// import { timeSignatureDurationMapping } from '../utils'; TODO pass time signature info down - make it a property

// Measures are represented as a mutable state wrapping the pitch renderer.
let timeNumerator = 4;
let timeDenominator = 4;
let beatsThusFar = 0;
let measureNumber = 0;

export function renderPitch(input: RuntimeOutput['mainReturn'], duration?: LiteralRhythm): string {
    let newMeasureText = ``;
    let closingMeasureText = ``;
    // Check if this is the first measure
    if (measureNumber === 0 && beatsThusFar === 0) {
        console.log('measure 0 init');
        if (input.properties && input.properties.time) {
            let [num, denom] = input.properties.time as any; //as [number, number]; // this is definitely [number, number]. TODO figure out how to type this
            timeNumerator = num;
            timeDenominator = denom;
        }
        newMeasureText = `
<measure number = 0>
    <attributes>
        <time>
            <beats>${timeNumerator}</beats>
            <beat-type>${timeDenominator}</beat-type>
        </time>
    </attributes>`;
    } else if (beatsThusFar === 0) {
        // Check if this is the first beat

        newMeasureText = `
<measure number = "${measureNumber}">`;
    }

    // Check if this note contains a time signature change, which forces the previous bar to end.

    if (input.properties && input.properties.time) {
        console.log('checking time');
        let [num, denom] = input.properties.time as any; //as [number, number]; // this is definitely [number, number]. TODO figure out how to type this
        if (timeNumerator !== num || timeDenominator !== denom) {
            console.log('time change');
            if (beatsThusFar !== timeNumerator) {
                console.warn('Changed time signatures before previous measure was complete.'); // TODO symbol location
            }
            measureNumber += 1;
            beatsThusFar = 0;
            timeNumerator = num;
            timeDenominator = denom;
            // TODO any note-level properties that apply to measures would be assigned here
            newMeasureText = `
<measure number="${measureNumber}">
    <attributes>
        <time>
            <beats>${timeNumerator}</beats>
            <beat-type>${timeDenominator}</beat-type>
        </time>
    </attributes>`;
            closingMeasureText = `</measure>`;
        }
    }

    // Check if this beat is the end of the measure.
    // Default to 1 beat.
    let numBeats = 1;
    if (duration !== undefined) {
        numBeats = timeSignatureDurationMapping(duration, [timeNumerator, timeDenominator]);
    }

    beatsThusFar += numBeats;

    console.log('beats thus far: ', beatsThusFar, timeDenominator);
    if (beatsThusFar >= timeNumerator) {
        console.log('New measure. Closing previous one.');
        if (beatsThusFar > timeNumerator) {
            console.warn('Measure did not line up with time signature. Excess beats.'); // TODO symbol location
        }
        measureNumber += 1;
        beatsThusFar = 0;
        closingMeasureText = `</measure>`;
    }

    // TODO the <duration> tag which depends on the time signature -- an unimplemented property
    // also the type, which will be passed in for pitch rhythm
    let output = `
        ${newMeasureText}
    <note>
        <pitch>
            <step>${input.returnValue.noteName}</step>
            <octave>${input.returnValue.octave}</octave>
            <duration>${numBeats}</duration>
`;
    if (input.returnValue.rhythmName) {
        output += `            <type>${input.returnValue.rhythmName}</type>\n`;
    }
    if (input.returnValue.accidental) {
        output += `            <alter>${input.returnValue.accidental}</alter>\n`;
    }

    return (
        output +
        `        </pitch>
    </note>
${closingMeasureText}`
    );
}
