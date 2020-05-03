import { RuntimeOutput } from '../runtime';
import { renderPitchRhythm } from './pitch-rhythm';

export function renderListPitchRhythm(input: RuntimeOutput['mainReturn'], idOverride?: string): string {
    // first, pass down properties to the first item
    if (input.properties) {
        input.returnValue[0].properties = { ...(input.returnValue[0].properties || {}), ...input.properties };
    }
    let id = input.properties?.part_id || idOverride || 'P1';
    let listPitchHeader = idOverride
        ? `
    <part id="${id}">`
        : `
    <part-list>
        <score-part id="${id}">
            <part-name>${id}</part-name>
        </score-part>
    </part-list>
    <part id="${id}">`;
    let output = listPitchHeader;
    let status;
    let count = 0;
    for (const note of input.returnValue) {
        status = renderPitchRhythm(note, count === input.returnValue.length - 1, status);
        output += status.output;
        count++;
    }

    output += `
    </part>`;

    return output;
}
