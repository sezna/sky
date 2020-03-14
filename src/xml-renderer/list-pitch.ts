import { RuntimeOutput } from '../runtime';
import { renderPitch } from './pitch';
import { nameToNumberMapping } from './utils';
import { RhythmName } from '../lexer/expression/literal';

export function renderListPitch(input: RuntimeOutput['mainReturn']): string {
    const duration =
        nameToNumberMapping[input.returnValue.rhythm.rhythmName as RhythmName] *
        (input.returnValue.rhythm.isDotted ? 1.5 : 1);

    return renderPitch(input, duration);
}
