import { Steps } from '../lexer/parser';
import { Token } from '../lexer/tokenizer';

export type FunctionEnvironment = { [funcName: string]: Func };

export type VariableEnvironment = { [varName: string]: Variable };

// can't use the word 'Function' because JS
export interface Func {
    _type: 'Func';
    parameters: { varName: Token; varType: Token }[];
    body: Steps;
    returnType: String;
}

interface Variable {
    varType: string;
    value: any;
    properties: { [propertyName: string]: string };
}

export function makeInitialFunctionEnvironment(): FunctionEnvironment {
    // TODO this is just an example
    return {
        rand: { _type: 'Func' as const, parameters: [], body: [], returnType: 'number' },
    };
}

export function makeInitialVariableEnvironment(): VariableEnvironment {
    // TODO this is just an example
    return {};
}
