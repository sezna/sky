import { RuntimeError } from '.';
import { Variable, Func, FunctionEnvironment, VariableEnvironment } from './environments';
import { Token } from '../lexer/tokenizer';
import { Expression } from '../lexer/expression';
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
  paramValues: Expression[],
  funcName: Token,
    functionEnvironment: FunctionEnvironment,
    variableEnvironment: VariableEnvironment,
): Either<RuntimeError, FunctionEvaluationResult> {
  if (paramValues.length !== func.parameters.length) {
    console.log(JSON.stringify(funcName));
    return left({
      line: funcName.value.line,
      column: funcName.value.column, // TODO
      reason: `Function "${funcName.value.value}" expected ${func.parameters.length} arguments but was called with ${paramValues.length}.`
    });
  }
    // evaluate all the parameters
    let parameterValues: Variable[] = [];
    for (const paramExpr of paramValues) {
        let paramRes = evaluate(paramExpr, functionEnvironment, variableEnvironment);
      if (isLeft(paramRes)) { return paramRes; }
      const param = paramRes.right;
      const properties: {[propertyName: string]: string} = param.returnProperties || {};
      parameterValues.push({ varType: param.returnType,
        value: param.returnValue,
        properties, 
      });
    }
    
  let paramsWithNames: VariableEnvironment = {};
  let i = 0;
  for (const val of parameterValues) { //parameterValues.reduce((acc: VariableEnvironment, val: any, i: number) => {
    let param = func.parameters[i]!;
    if (param.varType.value.value !== val.varType) {
      return left({
        line: funcName.value.line,
        column: funcName.value.column,
        reason: `Function "${funcName.value.value}" expected parameter ${i} ("${param.varName.value.value}") to be of type "${param.varType.value.value}" but it is actually of type "${val.varType}". `
      })
    }
    paramsWithNames[param.varName.value.value] = val;
    i++;
  };

  let localVariableEnvironment: VariableEnvironment = { ...variableEnvironment, ...paramsWithNames };
    for (const step of func.body) {
        if (step._type === 'Return') {
            let res = evaluate(step.returnExpr, functionEnvironment, localVariableEnvironment);
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

        let result = evaluate(step, functionEnvironment, localVariableEnvironment);
        if (isLeft(result)) {
            return result;
        }
        functionEnvironment = result.right.functionEnvironment;
        localVariableEnvironment = result.right.variableEnvironment;
    }
    return left({
        line: 0,
        column: 0,
        reason: `Function did not return anything. This is a bug in the compiler, as it should have been caught at the parsing stage, but this is the runtime. Please file a bug with the code that triggered this error at https://github.com/sezna/sky.`,
    });
}
