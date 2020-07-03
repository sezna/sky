import { VariableDeclaration } from '../lexer/variable-declaration';
import { addition, multiplication, division, subtraction, and, or, greaterThan, lessThan, equals } from './operators';
import { FunctionDeclaration } from '../lexer/function-declaration';
import { IfExp, LiteralExp, OpExp, VarExp } from '../lexer/expression';
import { FunctionEnvironment, VariableEnvironment } from './environments';
import { Step } from '../lexer/parser';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { RuntimeError } from './';
import { evalLiteral } from './eval-literal';
import { evalFunction } from './eval-function';
import * as _ from 'lodash';
export interface EvalResult {
    functionEnvironment: FunctionEnvironment;
    variableEnvironment: VariableEnvironment;
    returnValue: any; // TODO
    returnType: any;
    returnProperties?: { [key: string]: string };
}

export function evaluate(
    step: Step,
    functionEnvironment: FunctionEnvironment,
    variableEnvironment: VariableEnvironment,
): Either<RuntimeError, EvalResult> {
    console.log("Evaluating step: ", JSON.stringify(step, null, 1));
    let returnValue;
    let returnType;
    let returnProperties;
    if (step._type === 'VariableDeclaration') {
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
                reason: `Mismatched type: variable "${step.varName.value.value}" is declared with type "${step.varType.value.value}" but the right hand side returns type "${value.right.returnType}"`,
            });
        }
        variableEnvironment[step.varName.value.value] = {
            value: value.right.returnValue,
            varType: (step as VariableDeclaration).varType.value.value,
            properties: {},
        };
        // TODO validate that type matches return value
    } else if (step._type === 'LiteralExp') {
        let result = evalLiteral(step as LiteralExp, functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            return result;
        }
        let lit = result.right;
        returnValue = lit.returnValue;
        returnType = lit.returnType;
    } else if (step._type === 'OpExp') {
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
            case '||':
                operatorFunc = or;
                break;
            case '&&':
                operatorFunc = and;
                break;
            case '>':
                operatorFunc = greaterThan;
                break;
            case '<':
                operatorFunc = lessThan;
                break;
            case '==':
                operatorFunc = equals;
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
    } else if (step._type === 'VarExp') {
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
        returnProperties = varValue.properties;
    } else if (step._type === 'FunctionDeclaration') {
        let funcDeclStep = step as FunctionDeclaration;
        functionEnvironment[funcDeclStep.functionName.value.value] = {
            _type: 'Func',
            parameters: funcDeclStep.parameters,
            body: funcDeclStep.body,
            returnType: funcDeclStep.returnType.value.value,
        };
    } else if (step._type === 'IfExp') {
        let conditionResult = evaluate((step as IfExp).condition, functionEnvironment, variableEnvironment);
        if (isLeft(conditionResult)) {
            return conditionResult;
        }
        let condition = conditionResult.right;
        let branchResult;
        // If there is a 'then' and an 'else', then this is an evaluatable expression. If there is only a 'then', then this returns type 'none'.
        if (condition.returnValue === true) {
            branchResult = evaluate((step as IfExp).thenBranch, functionEnvironment, variableEnvironment);
        } else {
            if ((step as IfExp).elseBranch !== undefined) {
                branchResult = evaluate((step as IfExp).elseBranch!, functionEnvironment, variableEnvironment);
            }
        }
        if (branchResult && isLeft(branchResult)) {
            return branchResult;
        }
        returnType = step.returnType;
        returnValue = branchResult && branchResult.right.returnValue;
    } else if (step._type === 'PropertyAssignment') {
        // First, handle the indexes, if any. Note that this code is duplicated below, and if you want to change it, it is probably worth abstraction. TODO
        let indexes = [];
        if (step.indexes && step.indexes.length > 0) {
            for (const idxExpr of step.indexes) {
                const evalResult = evaluate(idxExpr, functionEnvironment, variableEnvironment);
                if (isLeft(evalResult)) {
                    return evalResult;
                }
                if (evalResult.right.returnType !== 'number') {
                    return left({
                        line: step.varName.value.line,
                        column: step.varName.value.column,
                        reason: `Attempted to index with a non-numerical type.`,
                    });
                }
                let idx = evalResult.right.returnValue as number;
                indexes.push(idx);
            }
        }
        if (indexes.length > 0) {
            // this is ugly...could do with a refactor someday. Basically just remove the last ".returnValue".
            let getString = indexes
                .map(elem => `[${elem}].returnValue`)
                .join('')
                .split('.')
                .slice(0, -1)!
                .join('.');
            if (_.get(variableEnvironment[step.varName.value.value].value, getString).properties === undefined) {
                _.set(variableEnvironment[step.varName.value.value].value, `${getString}.properties`, {});
            }
            let valueToSet = step.parsedValue === undefined ? step.value : step.parsedValue;
            _.set(
                variableEnvironment[step.varName.value.value].value,
                `${getString}.properties[${step.propertyName.value.value}]`,
                valueToSet,
            );
        } else {
            let valueToSet = step.parsedValue === undefined ? step.value : step.parsedValue;
            variableEnvironment[step.varName.value.value].properties[step.propertyName.value.value] = valueToSet;
        }
    } else if (step._type === 'Reassignment') {
        // First, handle the indexes, if any.
        let indexes = [];
        if (step.indexes && step.indexes.length > 0) {
            for (const idxExpr of step.indexes) {
                const evalResult = evaluate(idxExpr, functionEnvironment, variableEnvironment);
                if (isLeft(evalResult)) {
                    return evalResult;
                }
                if (evalResult.right.returnType !== 'number') {
                    return left({
                        line: step.name.value.line,
                        column: step.name.value.column,
                        reason: `Attempted to index with a non-numerical type.`,
                    });
                }
                let idx = evalResult.right.returnValue as number;
                indexes.push(idx);
            }
        }

        let evalResult = evaluate(step.newVarBody, functionEnvironment, variableEnvironment);
        if (isLeft(evalResult)) {
            return evalResult;
        }
        let newRetValue = evalResult.right.returnValue;
        let newRetType = evalResult.right.returnType;
        // Undeclared variable names are caught in the parsing stage, so this can be assumed to be defined. A more rigorous check could be added in the future, though.
        let varToBeReassigned = variableEnvironment[step.name.value.value];
        let oldType = varToBeReassigned.varType;
        if (indexes.length > 0) {
            let indexedVarToBeReassigned = varToBeReassigned.value;
            for (const idx of indexes) {
                indexedVarToBeReassigned = indexedVarToBeReassigned[idx];
                if (indexedVarToBeReassigned === undefined) {
                    return left({
                        line: step.name.value.line,
                        column: step.name.value.column,
                        reason: `Attempted to index variable "${step.name.value.value}" with index "${idx}", which was undefined.`,
                    });
                }
                indexedVarToBeReassigned = indexedVarToBeReassigned.returnValue;
            }
            // Remove the amount of 'list's from the type that corresponds to the number of index statements.
            oldType = varToBeReassigned.varType
                .split(' ')
                .splice(indexes.length)
                .join(' ');
        }
        if (newRetType !== oldType) {
            return left({
                line: step.name.value.line,
                column: step.name.value.column,
                reason: `Value reassigned to variable "${step.name.value.value}" has type "${newRetType}", which is differs from the declared type of that variable, which is "${varToBeReassigned.varType}"`,
            });
        }

        let newValue = {
            returnType: newRetType,
            returnValue: newRetValue,
        };
        if (indexes.length > 0) {
            let getString = indexes
                .map(elem => `[${elem}].returnValue`)
                .join('')
                .split('.')
                .slice(0, -1)
                .join('.');
            _.set(variableEnvironment[step.name.value.value].value, getString, newValue);
        } else {
            variableEnvironment[step.name.value.value].value = newRetValue;
        }
    } else if (step._type === 'Return') {
        return left({
            line: 0,
            column: 0,
            reason: `Attempted to evaluate a return statement. This is a bug in the compiler. Please file an issue with the code that triggered this bug at https://github.com/sezna/sky.`,
        });
    } else if (step._type === 'FunctionApplication') {
        let func = functionEnvironment[step.functionName.value.value];
        if (func === undefined) {
            return left({
                line: step.functionName.value.line,
                column: step.functionName.value.column,
                reason: `Function "${step.functionName.value.value}" is undefined.`,
            });
        }

        let funcAppRes = evalFunction(func, functionEnvironment, variableEnvironment);
        if (isLeft(funcAppRes)) {
            return funcAppRes;
        }
        let funcApp = funcAppRes.right;
        returnValue = funcApp.returnValue;
        returnType = funcApp.returnType;
        returnProperties = funcApp.properties;
    }
    return right({
        functionEnvironment,
        variableEnvironment,
        returnValue,
        returnType,
        returnProperties,
    });
}
