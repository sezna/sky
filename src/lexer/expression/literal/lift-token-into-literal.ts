import { scaleDegreeToInt } from '../../../utils/scale-degree-utils';
import { ParseError } from '../../parser';
import { Token } from '../../tokenizer';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { LiteralExp, LiteralValue } from './types';

export function liftTokenIntoLiteral(input: Token): Either<ParseError, LiteralExp> {
    let literalValue: LiteralValue;
    let token = input;
    switch (input.tokenType) {
        case 'numeric-literal':
            literalValue = {
                _type: 'LiteralNumber' as const,
                numericValue: parseInt(input.value.value),
                token,
            };
            break;
        case 'scale-degree-literal':
            let parseResult = scaleDegreeToInt(input);
            if (isLeft(parseResult)) {
                return parseResult;
            }
            let scaleDegreeNumber = parseResult.right;
            literalValue = {
                _type: 'LiteralScaleDegree',
                scaleDegreeNumber,
                token,
            };
            break;
        default:
            return left({
                line: 0,
                column: 0,
                reason: `unimplemented literal ${input.tokenType} ${input.value.value}`,
            });
    }

    return right({ _type: 'LiteralExp' as const, literalValue });
}
