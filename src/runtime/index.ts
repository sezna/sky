import { Steps } from '../lexer/parser';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { evalFunction } from './eval-function';
import { evaluate } from './evaluate';
import { makeInitialFunctionEnvironment, makeInitialVariableEnvironment, VariableEnvironment } from './environments';

interface SkyOutput {
    midi: String; // TODO
    sheetMusic: String; // TODO
    variableEnvironment: VariableEnvironment;
}

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

    let res = evalFunction(functionEnvironment['main'], functionEnvironment, variableEnvironment);
    if (isLeft(res)) {
        return res;
    }

    return right({
        midi: '',
        sheetMusic: '',
        variableEnvironment,
    });
}
