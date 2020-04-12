import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

export function renderListPitchRhythm(input: RuntimeOutput['mainReturn']): string {
    // first, pass down properties to the first item
    if (input.properties) {
        input.returnValue[0].properties = { ...input.returnValue[0], ...input.properties };
    }
    let id = input.properties?.part_id || 'P1'; // TODO configurability for list list
    let partName = input.properties?.part_name || 'P1';
    let listPitchHeader = `
    <part-list>
        <score-part id="${id}">
            <part-name>${partName}</part-name>
        </score-part>
    </part-list>
    <part id="${id}">`;
    let output = listPitchHeader;

    let status;
    for (const note of input.returnValue) {
        status = renderPitch(note, note.returnValue.rhythm, status);
        output += status.output;
    }

    output += `
    </part>`;

    return output;
}
