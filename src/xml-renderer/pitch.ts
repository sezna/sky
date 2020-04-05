import { RuntimeOutput } from '../runtime';
import { timeSignatureDurationMapping } from './utils';
import { LiteralRhythm } from '../lexer/expression/literal';
// import { timeSignatureDurationMapping } from '../utils'; TODO pass time signature info down - make it a property

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
    // Check if this is the first measure
    if (measureNumber === 1 && beatsThusFar === 0) {
        if (input.properties && input.properties.time) {
            let [num, denom] = input.properties.time as any; //as [number, number]; // this is definitely [number, number]. TODO figure out how to type this
            timeNumerator = num;
            timeDenominator = denom;
        }
        newMeasureText = `        <measure number="${measureNumber}">
            <attributes>
                <time>
                    <beats>${timeNumerator}</beats>
                    <beat-type>${timeDenominator}</beat-type>
                </time>
            </attributes>`;
    } else if (beatsThusFar === 0) {
        // Check if this is the first beat

        newMeasureText = `
        <measure number="${measureNumber}">`;
    }

    // Check if this note contains a time signature change, which forces the previous bar to end.

    if (input.properties && input.properties.time) {
        let [num, denom] = input.properties.time as any; //as [number, number]; // this is definitely [number, number]. TODO figure out how to type this
        if (timeNumerator !== num || timeDenominator !== denom) {
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
            closingMeasureText = `        </measure>`;
        }
    }

    // Check if this beat is the end of the measure.
    // Default to 1 beat.
    let numBeats = 1;
    if (duration !== undefined) {
        numBeats = timeSignatureDurationMapping(duration, [timeNumerator, timeDenominator]);
    }

    beatsThusFar += numBeats;

    if (beatsThusFar >= timeNumerator) {
        console.log('New measure. Closing previous one.');
        if (beatsThusFar > timeNumerator) {
            console.warn('Measure did not line up with time signature. Excess beats.'); // TODO symbol location
        }
        measureNumber += 1;
        beatsThusFar = 0;
        closingMeasureText = `        </measure>`;
    }

    // TODO the <duration> tag which depends on the time signature -- an unimplemented property
    // also the type, which will be passed in for pitch rhythm
    let output = `
${newMeasureText}
            <note>
                <pitch>
                    <step>${input.returnValue.noteName}</step>
                    <octave>${input.returnValue.octave}</octave>
`;

    if (input.returnValue.accidental) {
        output += `                    <alter>${input.returnValue.accidental}</alter>\n`;
    }

    output =
        output +
        `                </pitch>
${input.returnValue.rhythmName ? `            <type>${input.returnValue.rhythmName}</type>\n` : ``}
                <duration>${numBeats}</duration>
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
