import { Steps, Step } from '../lexer/parser';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { VariableDeclaration } from '../lexer/variable-declaration';
import { Literal, OpExp, VarExp } from '../lexer/expression/expression';

interface SkyOutput {
    midi: String; // TODO
    sheetMusic: String; // TODO
}

// can't use the word 'Function' because JS
interface Func {
    parameters: { name: String; varType: String }[];
    body: Steps;
    returnType: String;
}

export type FunctionEnvironment = { [funcName: string]: Func };

interface Variable {
    varType: string;
    value: any;
}

export type VariableEnvironment = { [varName: string]: Variable };
interface RuntimeError {
    reason: string;
    line: number;
    column: number;
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

    return right({
        midi: '',
        sheetMusic: '',
    });
}

interface EvalResult {
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
        variableEnvironment[step.varName.value.value] = {
            value: value.right.returnValue,
            varType: (step as VariableDeclaration).varType.value.value,
        };
        // TODO validate that type matches return value
    } else if ((step as Literal)._type === 'Literal') {
        returnValue = (step as Literal).literalValue;
        returnType = (step as Literal).literalType;
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
        switch ((step as OpExp).operator.value.value.value) {
            case '+':
                let addResult = addition(lhs, rhs);
                if (isLeft(addResult)) {
                    return addResult;
                }

                // TODO different types and whatnot, now we just
                // assume they are numbers
                returnType = addResult.right.addType;
                returnValue = addResult.right.value; // lol TODO

                break;
            default:
                return left({
                    line: (step as OpExp).operator.value.value.line,
                    column: (step as OpExp).operator.value.value.column,
                    reason: `Operator ${(step as OpExp).operator.value.value.value} is unimplemented`,
                });
        }
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
        rand: { parameters: [], body: [], returnType: 'number' },
    };
}

function makeInitialVariableEnvironment(): VariableEnvironment {
    return {
        x: { varType: 'number', value: 5 },
    };
}

function addition(lhs: EvalResult, rhs: EvalResult): Either<RuntimeError, { addType: any; value: any }> {
    if (lhs.returnType !== rhs.returnType) {
        return left({
            line: 0, // TODO
            column: 0, // TODO
            reason: `Unable to add two different types: ${lhs.returnType} and ${rhs.returnType}`,
        });
    }

    // Now we know they are the same so we can just check one side.
    if (lhs.returnType === 'number') {
        return right({ addType: 'number', value: lhs.returnValue + rhs.returnValue });
    }

    return left({
        line: 0,
        column: 0,
        reason: 'Unable to add anything yet',
    });
}
