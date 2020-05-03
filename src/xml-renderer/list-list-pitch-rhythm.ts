import { RuntimeOutput } from '../runtime';
import { renderListPitchRhythm } from './list-pitch-rhythm';

// TODO in single list pitch:
// part name and single part metadata extracted out into a single part name

export function renderListListPitchRhythm(input: RuntimeOutput['mainReturn']): string {
    // if this list of parts has any global properties,  then we initialize that as the properties in the first measure of all of its child parts
    if (input.properties) {
        for (var i = 0; i < input.returnValue.length; i++) {
            input.returnValue[i].properties = { ...(input.returnValue[i].properties || {}), ...input.properties };
        }
    }
    let listOfPartNames = input.returnValue.map((part: any, idx: number) => part.properties?.part_id || `P${idx + 1}`);
    let partDeclarations = listOfPartNames
        .map(
            (partName: string) =>
                `      <score-part id="${partName}">
        <part-name>${partName}</part-name>
      </score-part>`,
        )
        .join('\n');
    let listPitchHeader = `
    <part-list>
${partDeclarations}
    </part-list>`;
    let output = listPitchHeader;
    let count = 0;
    for (const part of input.returnValue) {
        output += renderListPitchRhythm(part, listOfPartNames[count]);
        count++;
    }

    return output;
}
