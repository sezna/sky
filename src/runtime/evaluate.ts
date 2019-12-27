import { VariableDeclaration } from '../lexer/variable-declaration';
import { addition, multiplication, division, subtraction, and, or, greaterThan, lessThan, equals } from './operators';
import { FunctionDeclaration } from '../lexer/function-declaration';
import { IfExp, LiteralExp, OpExp, VarExp } from '../lexer/expression';
import { FunctionEnvironment, VariableEnvironment } from './environments';
import { Step } from '../lexer/parser';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { RuntimeError } from './';
import { evalLiteral } from './eval-literal';
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
        };
        // TODO validate that type matches return value
    } else if (step._type === 'LiteralExp') {
        let result = evalLiteral(step as LiteralExp);
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
    } else if (step._type === 'Return') {
        return left({
            line: 0,
            column: 0,
            reason: `Attempted to evaluate a return statement. This is a bug in the compiler. Please file an issue with the code that triggered this bug at https://github.com/sezna/sky.`,
        });
    } else {
        return left({
            line: 0,
            column: 0,
            reason: `Unimplemented step: ${step._type}`,
        });
    }

    return right({
        functionEnvironment,
        variableEnvironment,
        returnValue,
        returnType,
    });
}
