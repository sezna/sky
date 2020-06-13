import { PitchRenderResult } from './pitch';
import { LiteralRhythm } from '../lexer/expression/literal';
import { RuntimeOutput } from '../runtime';
export function renderChord(
    _input: RuntimeOutput['mainReturn'],
    _isLast: boolean,
    _duration?: LiteralRhythm,
    _status = {
        output: '',
        timeNumerator: 4,
        timeDenominator: 4,
        beatsThusFar: 0,
        measureNumber: 0,
    },
): PitchRenderResult {
    console.error('Renderchord is unimplemented!');

    return {
        output: '',
        timeNumerator: 0,
        timeDenominator: 0,
        beatsThusFar: 0,
        measureNumber: 0,
    };
}
