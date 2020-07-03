import * as LiteralTypes from '../lexer/expression/literal';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { Token } from '../lexer/tokenizer';
import { RuntimeError } from './';
import { evaluate } from './evaluate';
import { Expression } from '../lexer/expression';
import { Pitch } from '../lexer/expression/literal/types';
import { FunctionEnvironment, VariableEnvironment } from './environments';
/**
 * This function needs the environments for evaluating a list, which could contain non-literals.
 */
export function evalLiteral(
    literalExp: LiteralTypes.LiteralExp,
    functionEnvironment: FunctionEnvironment,
    variableEnvironment: VariableEnvironment,
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
            if (literal.pitches.length > 1) {
                let pitchBuffer: Pitch[] = [];
                // If any pitches in this list are still expressions, they need to be evaluated here.
                for (let i = 0; i < literal.pitches.length; i++) {
                    if (literal.pitches[i]._type !== 'Pitch') {
                        if ((literal.pitches[i] as Expression).returnType !== 'pitch') {
                            return left({
                                line: token.value.line,
                                column: token.value.column,
                                reason: `Element of chord "${token.value.value}" is not of type "pitch".`,
                            });
                        }
                        let res = evaluate(literal.pitches[i] as Expression, functionEnvironment, variableEnvironment);
                        if (isLeft(res)) {
                            return res;
                        }
                        let evaluated = res.right.returnValue;
                        while (
                            evaluated.pitches.filter((x: any) =>
                                ['LiteralExp', 'LiteralPitch', 'VarExp'].includes(x._type),
                            ).length > 0
                        ) {
                            let pitchesToRemove = [];
                            let pitchesToAdd: Pitch[] = [];
                            for (let i = 0; i < evaluated.pitches.length; i++) {
                                if (evaluated.pitches[i]._type === 'LiteralExp') {
                                    evaluated.pitches[i] = evaluated.pitches[i].literalValue;
                                }
                                if (evaluated.pitches[i]._type === 'LiteralPitch') {
                                    let pitch = { ...evaluated.pitches[i] };
                                    pitchesToAdd = pitchesToAdd.concat(pitch.pitches);
                                    pitchesToRemove.push(i);
                                }
                                if (evaluated.pitches[i]._type === 'VarExp') {
                                    let res = evaluate(
                                        literal.pitches[i] as Expression,
                                        functionEnvironment,
                                        variableEnvironment,
                                    );
                                    if (isLeft(res)) {
                                        return res;
                                    }
                                    let pitch = res.right.returnValue;
                                    pitchesToRemove.push(i);
                                    pitchesToAdd = pitchesToAdd.concat(pitch);
                                }
                            }
                            for (let i = pitchesToRemove.length; i >= 0; i--) {
                                evaluated.pitches.splice(i, 1);
                            }
                            evaluated.pitches = [...evaluated.pitches, ...pitchesToAdd];
                        }
                        pitchBuffer = pitchBuffer.concat(evaluated.pitches);
                    } else {
                        pitchBuffer.push(literal.pitches[i] as Pitch);
                    }
                }
                literal.pitches = pitchBuffer;
            }
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
            let outputListResults = literal.listContents.map(x =>
                evaluate(x, functionEnvironment, variableEnvironment),
            );
            let outputList = [];
            for (const elem of outputListResults) {
                if (isLeft(elem)) {
                    return elem;
                }
                outputList.push({
                    returnValue: elem.right.returnValue,
                    returnType: returnTypes[0],
                    properties: elem.right.returnProperties,
                });
            }
            returnValue = outputList;
            returnType = `list ${returnTypes[0]}`;
            break;
        case 'LiteralBoolean':
            returnValue = (literal as LiteralTypes.LiteralBoolean).value;
            returnType = 'boolean';
            break;
        case 'LiteralPitchRhythm':
            if (literal.pitches.length > 1) {
                let pitchBuffer: Pitch[] = [];
                // If any pitches in this list are still expressions, they need to be evaluated here.
                for (let i = 0; i < literal.pitches.length; i++) {
                    if (literal.pitches[i]._type !== 'Pitch') {
                        if ((literal.pitches[i] as Expression).returnType !== 'pitch') {
                            return left({
                                line: token.value.line,
                                column: token.value.column,
                                reason: `Element of chord "${token.value.value}" is not of type "pitch".`,
                            });
                        }
                        let res = evaluate(literal.pitches[i] as Expression, functionEnvironment, variableEnvironment);
                        if (isLeft(res)) {
                            return res;
                        }
                        let evaluated = res.right.returnValue;
                        while (
                            evaluated.pitches.filter((x: any) =>
                                ['LiteralExp', 'LiteralPitch', 'VarExp'].includes(x._type),
                            ).length > 0
                        ) {
                            let pitchesToRemove = [];
                            let pitchesToAdd: Pitch[] = [];
                            for (let i = 0; i < evaluated.pitches.length; i++) {
                                if (evaluated.pitches[i]._type === 'LiteralExp') {
                                    evaluated.pitches[i] = evaluated.pitches[i].literalValue;
                                }
                                if (evaluated.pitches[i]._type === 'LiteralPitch') {
                                    let pitch = { ...evaluated.pitches[i] };
                                    pitchesToAdd = pitchesToAdd.concat(pitch.pitches);
                                    pitchesToRemove.push(i);
                                }
                                if (evaluated.pitches[i]._type === 'VarExp') {
                                    let res = evaluate(
                                        literal.pitches[i] as Expression,
                                        functionEnvironment,
                                        variableEnvironment,
                                    );
                                    if (isLeft(res)) {
                                        return res;
                                    }
                                    let pitch = res.right.returnValue;
                                    pitchesToRemove.push(i);
                                    pitchesToAdd = pitchesToAdd.concat(pitch);
                                }
                            }
                            for (let i = pitchesToRemove.length; i >= 0; i--) {
                                evaluated.pitches.splice(i, 1);
                            }
                            evaluated.pitches = [...evaluated.pitches, ...pitchesToAdd];
                        }
                        pitchBuffer = pitchBuffer.concat(evaluated.pitches);
                    } else {
                        pitchBuffer.push(literal.pitches[i] as Pitch);
                    }
                }
                literal.pitches = pitchBuffer;
            }
            returnValue = literal;
            returnType = 'pitch_rhythm';
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
