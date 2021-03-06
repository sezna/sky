import { RuntimeOutput } from '../runtime';
import { calculateDuration } from './utils';
import { LiteralRhythm } from '../lexer/expression/literal';
//import { renderChord } from './chord';

const divisions = 144;
export interface PitchRenderResult {
    output: string;
    timeNumerator: number;
    timeDenominator: number;
    beatsThusFar: number;
    measureNumber: number;
}

interface Prerender {
    isNewMeasure: boolean;
    attributes: { [key: string]: any };
    pitchData: string;
    isEndOfMeasure: boolean;
}

export function renderPitch(
    input: RuntimeOutput['mainReturn'],
    isLast: boolean,
    duration?: LiteralRhythm,
    status = {
        output: '',
        timeNumerator: 4,
        timeDenominator: 4,
        beatsThusFar: 0,
        measureNumber: 0,
    },
): PitchRenderResult {
    let { timeNumerator, timeDenominator, beatsThusFar, measureNumber } = status;
    let fifths = (input.properties && input.properties.key && (input.properties.key as any).keyData?.fifths) || 0;
    let mode = (input.properties && input.properties.key && (input.properties.key as any).quality) || 'major';
    let { sign, line, octave } = (input.properties && (input.properties.clef as any)) || {
        sign: 'G',
        line: '2',
        octave: 0,
    };
    let dynamic = input.properties?.dynamic;
    let fermata = input.properties?.fermata;
    let prerender: Prerender = {
        isNewMeasure: false,
        attributes: {},
        pitchData: '',
        isEndOfMeasure: false,
    };

    // If this is the first measure, then this is a new measure and we render all of the attributes.
    if (measureNumber === 0 && beatsThusFar === 0) {
        prerender.isNewMeasure = true;
        prerender.attributes.divisions = divisions;
        prerender.attributes.clef = {
            sign,
            line,
            octave,
        };
        prerender.attributes.key = {
            fifths,
            mode,
        };
        prerender.attributes.time = {
            beats: timeNumerator,
            'beat-type': timeDenominator,
        };
    }
    if (beatsThusFar === 0) {
        measureNumber += 1;
        prerender.isNewMeasure = true;
    }

    // Check if this note contains a key signature change
    if (input.properties && input.properties.key) {
        let keyProperties = input.properties.key as any;
        let fifths = keyProperties.keyData.fifths;
        let mode = keyProperties.quality;

        if (beatsThusFar !== 0) {
            // TODO column and line
            console.warn(
                `Key signature "${keyProperties.tonic} ${mode}" in measure ${measureNumber} may not be rendered because it does not fall on a new measure.`,
            );
        }

        prerender.attributes.key = { fifths, mode };
    }

    // check if this note  contains a clef change
    if (input.properties && input.properties.clef) {
        if (beatsThusFar !== 0) {
            // TODO column and line
            console.warn(
                `Clef change in measure ${measureNumber} may not be rendered because it does not fall on a new measure.`,
            );
        }
        let { sign, line, octave } = input.properties.clef as any;
        prerender.attributes.clef = { sign, line, octave };
    }

    // check if this note contains a time signature change

    if (input.properties && input.properties.time) {
        let [num, denom] = input.properties.time as any; //as [number, number]; // this is definitely [number, number]. TODO figure out how to type this
        if (timeNumerator !== num || timeDenominator !== denom) {
            if (beatsThusFar !== divisions * timeNumerator && beatsThusFar !== 0) {
                console.warn('Changed time signatures before previous measure was complete.'); // TODO symbol location
            }
        }
        prerender.attributes.divisions = divisions;
        prerender.attributes.time = {
            beats: num,
            'beat-type': denom,
        };
        timeNumerator = num;
        timeDenominator = denom;
    }

    // Check if this beat is the end of the measure.
    // Default to 1 beat.
    let numBeats = divisions;
    if (duration !== undefined) {
        numBeats = calculateDuration(duration, divisions);
    }

    beatsThusFar += numBeats;
    // New measure
    if (beatsThusFar >= divisions * timeNumerator) {
        if (beatsThusFar > divisions * timeNumerator) {
            console.warn('Measure did not line up with time signature. Excess beats.'); // TODO symbol location
        }
        beatsThusFar = 0;
        prerender.isEndOfMeasure = true;
    }

    // render the prerender into xml
    let newMeasureText = '';
    let hasAttributes = Object.keys(prerender.attributes).length !== 0;
    if (prerender.isNewMeasure) {
        newMeasureText = `
<measure number="${measureNumber}">${
            hasAttributes
                ? `
    <attributes>
        <divisions>${divisions}</divisions>
        ${
            prerender.attributes.key
                ? `<key>
            <fifths>${prerender.attributes.key.fifths}</fifths>
            <mode>${prerender.attributes.key.mode}</mode>
        </key>`
                : ''
        }
        ${
            prerender.attributes.time
                ? `<time>
            <beats>${prerender.attributes.time.beats}</beats>
            <beat-type>${prerender.attributes.time['beat-type']}</beat-type>
        </time>`
                : ''
        }
        ${
            prerender.attributes.clef
                ? `<clef>
            <sign>${prerender.attributes.clef.sign}</sign>
            <line>${prerender.attributes.clef.line}</line>${
                      prerender.attributes.clef.octave
                          ? `
            <octave>${prerender.attributes.clef.octave}</octave>`
                          : ''
                  }
        </clef>`
                : ''
        }
    </attributes>`
                : ``
        }`;
    }
    let pitchTexts = [];
    for (let i = 0; i < input.returnValue.pitches.length; i++) {
        let pitchText = `<pitch>
            <step>${input.returnValue.pitches[i].noteName.toUpperCase()}</step>
            <octave>${input.returnValue.pitches[i].octave}</octave>`;

        if (input.returnValue.pitches[i].accidental) {
            let alterTagContent = 0;
            switch (input.returnValue.pitches[i].accidental) {
                case 'flat':
                    alterTagContent = -1;
                    break;
                case 'sharp':
                    alterTagContent = 1;
                    break;
            }
            pitchText += `
            <alter>${alterTagContent}</alter>`;
        }

        pitchText += `
        </pitch>`;

        // if it is a rest, none of the above mattered and we just say <rest/>
        if (input.properties?.isRest || input.returnValue.pitches[i].noteName === '_') {
            pitchText = `<rest/>`;
        }

        let noteText = '';
        if (dynamic && i == 0) {
            noteText += `
    <direction placement="below">
        <direction-type>
            <dynamics default-x="56" default-y="-67" halign="left">
                <${dynamic}/>
            </dynamics>
        </direction-type>
        <offset sound="yes">8</offset>
        <sound dynamics="40"/>
    </direction>`;
        }
        noteText += `
    <note>${
        i === 0
            ? ''
            : `
        <chord/>`
    }
        ${pitchText}`;
        if (fermata && i == 0) {
            noteText += `
        <notations>
            <fermata default-y="20" relative-x="0"/>
        </notations>`;
        }

        noteText += `
        <duration>${numBeats}</duration>${
            duration && duration.isDotted
                ? `
        <dot/>`
                : ''
        }
    </note>`;
        pitchTexts.push(noteText);
    }

    let closingMeasureText =
        prerender.isEndOfMeasure || isLast
            ? `
</measure>`
            : '';

    let output = newMeasureText + pitchTexts.join('') + closingMeasureText;
    // add indentation
    output = output
        .split('\n')
        .map(x => `        ${x}`.replace(/\s+$/, ''))
        .join('\n');

    let finalTimeDenominator = (prerender.attributes.time && prerender.attributes.time['beat-type']) || timeDenominator;
    let finalTimeNumerator = (prerender.attributes.time && prerender.attributes.time['beat']) || timeNumerator;
    return {
        output,
        timeDenominator: finalTimeDenominator,
        timeNumerator: finalTimeNumerator,
        beatsThusFar,
        measureNumber,
    };
}
