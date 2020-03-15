import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';
import { nameToNumberMapping } from './utils';
import { RhythmName } from '../lexer/expression/literal';

export function renderListPitchRhythm(input: RuntimeOutput['mainReturn']): string {
    let output = '';

    for (const note of input.returnValue) {
        const duration =
            nameToNumberMapping[input.returnValue.rhythm.rhythmName as RhythmName] *
            (input.returnValue.rhythm.isDotted ? 1.5 : 1);
        output += renderPitch(note, duration);
    }

    return output;
}
