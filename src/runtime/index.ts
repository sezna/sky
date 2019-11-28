import { Steps, Step } from '../lexer/parser';
import { Token } from '../lexer/tokenizer';
import * as LiteralTypes from '../lexer/expression/literal';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { VariableDeclaration } from '../lexer/variable-declaration';
import { FunctionDeclaration } from '../lexer/function-declaration';
import { LiteralExp, OpExp, VarExp } from '../lexer/expression';
import { addition, multiplication, division, subtraction } from './operators';

interface SkyOutput {
    midi: String; // TODO
    sheetMusic: String; // TODO
    variableEnvironment: VariableEnvironment;
}

// can't use the word 'Function' because JS
interface Func {
    _type: 'Func';
    parameters: { name: Token; varType: Token }[];
    body: Steps;
    returnType: String;
}

export type FunctionEnvironment = { [funcName: string]: Func };

interface Variable {
    varType: string;
    value: any;
}

export type VariableEnvironment = { [varName: string]: Variable };
export interface RuntimeError {
    reason: string;
    line?: number;
    column?: number;
}

export function runtime(steps: Steps): Either<RuntimeError, SkyOutput> {
    let functionEnvironment = makeInitialFunctionEnvironment();
    let variableEnvironment = makeInitialVariableEnvironment();

    for (const step of steps) {
        let result = evaluate(step, functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            return result;
        }
        functionEnvironment = result.right.functionEnvironment;
        variableEnvironment = result.right.variableEnvironment;
    }

    // Now, find the main function and run it.
    if (functionEnvironment['main'] === undefined) {
        return left({
            reason: 'No main function found',
        });
    }

    for (const step of functionEnvironment['main'].body) {
        let result = evaluate(step, functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            return result;
        }
        functionEnvironment = result.right.functionEnvironment;
        variableEnvironment = result.right.variableEnvironment;
    }

    return right({
        midi: '',
        sheetMusic: '',
        variableEnvironment,
    });
}

export interface EvalResult {
    functionEnvironment: FunctionEnvironment;
    variableEnvironment: VariableEnvironment;
    returnValue?: any; // TODO
    returnType?: any;
}

export function evaluate(
    step: Step,
    functionEnvironment: FunctionEnvironment,
    variableEnvironment: VariableEnvironment,
): Either<RuntimeError, EvalResult> {
    let returnValue;
    let returnType;
    if ((step as VariableDeclaration)._type === 'VariableDeclaration') {
        step = step as VariableDeclaration;
        let value = evaluate((step as VariableDeclaration).varBody, functionEnvironment, variableEnvironment);
        if (isLeft(value)) {
            return value;
        }
        if (value.right.returnValue === undefined) {
            return left({
                line: step.varName.value.line,
                column: step.varName.value.column,
                reason: 'Unable to assign null value to variable',
            });
        }
        if (step.varType.value.value !== value.right.returnType) {
            return left({
                line: step.varType.value.line,
                column: step.varType.value.column,
                reason: `Mismatched type: variable "${step.varName.value.value} is declared with type ${step.varType.value.value} but the right hand side returns type ${value.right.returnType}`,
            });
        }
        variableEnvironment[step.varName.value.value] = {
            value: value.right.returnValue,
            varType: (step as VariableDeclaration).varType.value.value,
        };
        // TODO validate that type matches return value
    } else if ((step as LiteralExp)._type === 'LiteralExp') {
        let result = evalLiteral(step as LiteralExp);
        if (isLeft(result)) {
            return result;
        }
        let lit = result.right;
        returnValue = lit.returnValue;
        returnType = lit.returnType;
    } else if ((step as OpExp)._type === 'OpExp') {
        let leftResult = evaluate((step as OpExp).left, functionEnvironment, variableEnvironment);
        let rightResult = evaluate((step as OpExp).right, functionEnvironment, variableEnvironment);
        if (isLeft(leftResult)) {
            return leftResult;
        }
        if (isLeft(rightResult)) {
            return rightResult;
        }

        // this namespace collision between the Either monad and
        // the natural left and right handedness of operator expressions
        // is annoying
        let lhs = leftResult.right;
        let rhs = rightResult.right;
        let operatorFunc;
        switch ((step as OpExp).operator.value.value.value) {
            case '+':
                operatorFunc = addition;
                break;
            case '*':
                operatorFunc = multiplication;
                break;
            case '-':
                operatorFunc = subtraction;
                break;
            case '/':
                operatorFunc = division;
                break;
            default:
                return left({
                    line: (step as OpExp).operator.value.value.line,
                    column: (step as OpExp).operator.value.value.column,
                    reason: `Operator ${(step as OpExp).operator.value.value.value} is unimplemented`,
                });
        }
        let opResult = operatorFunc(lhs, rhs);
        if (isLeft(opResult)) {
            return opResult;
        }

        // TODO different types and whatnot, now we just
        // assume they are numbers
        returnType = opResult.right.valueType;
        returnValue = opResult.right.value;
    } else if ((step as VarExp)._type === 'VarExp') {
        let varValue = variableEnvironment[(step as VarExp).varName.value.value];
        if (varValue === undefined) {
            return left({
                line: (step as VarExp).varName.value.line,
                column: (step as VarExp).varName.value.column,
                reason: `Variable ${(step as VarExp).varName.value.value} is undefined`,
            });
        }
        returnType = varValue.varType;
        returnValue = varValue.value;
    } else if ((step as FunctionDeclaration)._type === 'FunctionDeclaration') {
        let funcDeclStep = step as FunctionDeclaration;
        functionEnvironment[funcDeclStep.functionName.value.value] = {
            _type: 'Func',
            parameters: funcDeclStep.parameters,
            body: funcDeclStep.body,
            returnType: funcDeclStep.returnType.value.value,
        };
    } else {
        return left({
            line: 0,
            column: 0,
            reason: `Unimplemented step: ${JSON.stringify(step, null, 2)}`,
        });
    }

    return right({
        functionEnvironment,
        variableEnvironment,
        returnValue,
        returnType,
    });
}

function makeInitialFunctionEnvironment(): FunctionEnvironment {
    return {
        rand: { _type: 'Func' as const, parameters: [], body: [], returnType: 'number' },
    };
}

function makeInitialVariableEnvironment(): VariableEnvironment {
    return {
        x: { varType: 'number', value: 5 },
    };
}

function evalLiteral(
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
        default:
            return left({
                line: token.value.line,
                column: token.value.column,
                reason: `Unimplemented literal evaluation "${token.value.value}" (${literal._type}.`,
            });
    }
    return right({ returnValue, returnType, token });
}
