import * as LiteralTypes from '../lexer/expression/literal';
import { Either, right, left } from 'fp-ts/lib/Either';
import { Token } from '../lexer/tokenizer';
import { RuntimeError } from './';
export function evalLiteral(
    literalExp: LiteralTypes.LiteralExp,
): Either<RuntimeError, { returnValue: any; returnType: any; token: Token }> {
    let returnValue: any = 'unimplemented';
    let returnType: any = 'unimplemented';
    let literal = literalExp.literalValue;
    let token = literal.token!;
    switch (literal._type) {
        case 'LiteralNumber':
            returnValue = (literal as LiteralTypes.LiteralNumber).numericValue;
            returnType = 'number';
            break;
        case 'LiteralScaleDegree':
            returnValue = (literal as LiteralTypes.LiteralScaleDegree).scaleDegreeNumber;
            returnType = 'degree';
            break;
        case 'LiteralPitch':
            returnValue = literal as LiteralTypes.LiteralPitch;
            returnType = 'pitch';
            break;
        case 'LiteralList':
            let returnTypes = (literal as LiteralTypes.LiteralList).listContents.map(x => x.returnType);
            let typesMatch = returnTypes.filter(x => x === returnTypes[0]).length === returnTypes.length;
            if (!typesMatch) {
                return left({
                    line: token.value.line,
                    column: token.value.column,
                    reason: `List inferred to have type of "list ${returnTypes[0]}" due to the first element, but contains items of a different type.`,
                });
            }
            returnValue = (literal as LiteralTypes.LiteralList).listContents;
            returnType = `list ${returnTypes[0]}`;
            break;
        case 'LiteralBoolean':
            returnValue = (literal as LiteralTypes.LiteralBoolean).value;
            returnType = 'boolean';
            break;
        default:
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: `Unimplemented literal evaluation "${token.value.value}" (${literal._type}.`,
            });
    }
    return right({ returnValue, returnType, token });
}
