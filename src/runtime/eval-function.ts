import { RuntimeError } from '.';
import { Func, FunctionEnvironment, VariableEnvironment } from './environments';
import { evaluate } from './evaluate';
import { isLeft, right, left, Either } from 'fp-ts/lib/Either';
import { Expression } from '../lexer/expression/expression';
import { LiteralExp } from '../lexer/expression/literal';

// This is a little ridiculous but there's not a dynamic way to add "list" before the typename dynamically that I know of.
type ReturnType =
    | 'number'
    | 'pitch'
    | 'pitch_rhythm'
    | 'rhythm'
    | 'scale_degree'
    | 'list number'
    | 'list pitch'
    | 'list pitch_rhythm'
    | 'list rhythm'
    | 'list scale_degree'
    | 'list list number'
    | 'list list pitch'
    | 'list list pitch_rhythm'
    | 'list list rhythm'
    | 'list list scale_degree'; // TODO this is non-exhaustive right now

export interface FunctionEvaluationResult {
    returnType: ReturnType;
    returnValue: any; // TODO
    properties?: { [key: string]: string };
}
export function evalFunction(
    func: Func,
    args: Expression[],
    functionEnvironment: FunctionEnvironment,
    globalVariableEnvironment: VariableEnvironment,
): Either<RuntimeError, FunctionEvaluationResult> {
    // look up this function application in the environment, which should contain all declarations

    let evaluatedArgs: VariableEnvironment = {};
    for (let i = 0; i < args.length; i++) {
        if (i >= func.parameters.length) {
            let { line, column } =
                args[i]._type === ('LiteralExp' as const)
                    ? (args[i] as LiteralExp).literalValue.token
                    : (args[i] as any).token;
            return left({
                line,
                column,
                reason: `Incorrect number of arguments. Function expected ${func.parameters.length} arguments but ${args.length} were provided.`,
            });
        }
        let argExpr = args[i];
        let param = func.parameters[i];
        let evaluateRes = evaluate(argExpr, functionEnvironment, globalVariableEnvironment);
        if (isLeft(evaluateRes)) {
            return evaluateRes;
        }
        let evaluated = evaluateRes.right;
        if (param.varType.value.value !== evaluated.returnType) {
            let { line, column } =
                args[i]._type === ('LiteralExp' as const)
                    ? (args[i] as LiteralExp).literalValue.token
                    : (args[i] as any).token;
            return left({
                line,
                column,
                reason: `Type mismatch in argment ${i} of function application for function application. Expected type "${param.varType.value.value}" but received type "${evaluated.returnType}"`,
            });
        }

        evaluatedArgs[param.varName.value.value] = {
            varType: param.varType.value.value,
            value: evaluated.returnValue,
            properties: evaluated.returnProperties || {},
        };
    }

    let variableEnvironment: VariableEnvironment = { ...globalVariableEnvironment, ...evaluatedArgs };
    for (const step of func.body) {
        if (step._type === 'Return') {
            let res = evaluate(step.returnExpr, functionEnvironment, variableEnvironment);
            if (isLeft(res)) {
                return res;
            }
            let funcResult = {
                returnType: res.right.returnType,
                returnValue: res.right.returnValue,
                properties: res.right.returnProperties,
            };
            return right(funcResult);
        }

        let result = evaluate(step, functionEnvironment, variableEnvironment);
        if (isLeft(result)) {
            return result;
        }
        functionEnvironment = result.right.functionEnvironment;
        variableEnvironment = result.right.variableEnvironment;
    }
    return left({
        line: 0,
        column: 0,
        reason: `Function did not return anything. This is a bug in the compiler, as it should have been caught at the parsing stage, but this is the runtime. Please file a bug with the code that triggered this error at https://github.com/sezna/sky.`,
    });
}
