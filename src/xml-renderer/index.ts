import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';
import { renderPitchRhythm } from './pitch-rhythm';
import { renderListPitch } from './list-pitch';
import { renderListPitchRhythm } from './list-pitch-rhythm';
import { renderListListPitch } from './list-list-pitch';
import { renderListListPitchRhythm } from './list-list-pitch-rhythm';
import { generateHeader, generateCloser } from './utils';

/**
 * Takes the runtime output (the return value from the main function) and renders it into musicXML.
 */
export function render(input: RuntimeOutput): string {
    const mainReturnType = input.mainReturn.returnType;
    const mainProperties = input.mainReturn.properties || {};
    let output = '';

    switch (mainReturnType) {
        case 'pitch':
            output += generateHeader(mainProperties);
            output += `
    <part-list>
        <score-part id="P1">
            <part-name>Part 1</part-name>
        </score-part>
    </part-list>
    <part id="P1">`;
            output += renderPitch(input.mainReturn, true).output;
            output += `
    </part>`;
            output += generateCloser();
            break;
        case 'pitch_rhythm':
            output += generateHeader(mainProperties);
            output += `
    <part-list>
        <score-part id="P1">
            <part-name>Part 1</part-name>
        </score-part>
    </part-list>
    <part id="P1">`;
            output += renderPitchRhythm(input.mainReturn, true).output;
            output += `
    </part>`;
            output += generateCloser();
            break;
        case 'list pitch':
            output += generateHeader(mainProperties) + renderListPitch(input.mainReturn) + generateCloser();
            break;
        case 'list pitch_rhythm':
            output += generateHeader(mainProperties) + renderListPitchRhythm(input.mainReturn) + generateCloser();
            break;
        case 'list list pitch':
            output += generateHeader(mainProperties) + renderListListPitch(input.mainReturn) + generateCloser();
            break;
        case 'list list pitch_rhythm':
            output += generateHeader(mainProperties) + renderListListPitchRhythm(input.mainReturn) + generateCloser();
            break;
        default:
            console.log(`Type "${mainReturnType}" cannot currently be rendered into XML. Failed to render:
${JSON.stringify(input.mainReturn.returnValue, null, 2)}`);
    }
    return output;
}
