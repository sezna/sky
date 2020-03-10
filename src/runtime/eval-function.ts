import { RuntimeError } from '.';
import { Func, FunctionEnvironment, VariableEnvironment } from './environments';
import { evaluate } from './evaluate';
import { isLeft, right, left, Either } from 'fp-ts/lib/Either';

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
    functionEnvironment: FunctionEnvironment,
    variableEnvironment: VariableEnvironment,
): Either<RuntimeError, FunctionEvaluationResult> {
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
