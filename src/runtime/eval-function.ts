import { Func, FunctionEnvironment, VariableEnvironment, evaluate, RuntimeError } from '.';
import { isLeft, right, left, Either } from 'fp-ts/lib/Either';
export function evalFunction(
    func: Func,
    functionEnvironment: FunctionEnvironment,
    variableEnvironment: VariableEnvironment,
): Either<RuntimeError, { returnType: string; returnValue: any }> {
    for (const step of func.body) {
        if (step._type === 'Return') {
            let res = evaluate(step.returnExpr, functionEnvironment, variableEnvironment);
            if (isLeft(res)) {
                return res;
            }
            return right({ returnType: step.returnExpr.returnType, returnValue: res.right });
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
