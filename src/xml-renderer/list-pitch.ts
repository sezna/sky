import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';

// TODO in single list pitch:
// part name and single part metadata extracted out into a single part name

export function renderListPitch(input: RuntimeOutput['mainReturn'], idOverride?: string): string {
    let id = input.properties?.part_id || idOverride || 'P1'; // TODO configurability for list list
    let partName = input.properties?.part_name || 'P1';
    let listPitchHeader = idOverride
        ? `
    <part id="${id}">`
        : `
    <part-list>
        <score-part id="${id}">
            <part-name>${partName}</part-name>
        </score-part>
    </part-list>
    <part id="${id}">`;
    let output = listPitchHeader;
    let status;
    let count = 0;
    for (const note of input.returnValue) {
        status = renderPitch(note, count === input.returnValue.length - 1, note.returnValue.rhythm, status);
        output += status.output;
        count++;
    }

    output += `
    </part>`;

    return output;
}
