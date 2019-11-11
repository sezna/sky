import { Token } from '../tokenizer';
import { Operator } from './parse-expression';

/**
 * This is where all of the potential expression types are defined.
 */

export interface IfExp {
    _type: 'IfExp';
    condition: Expression;
    thenBranch: Expression;
    elseBranch?: Expression;
}

export interface VarExp {
    _type: 'VarExp';
    varName: Token;
}

export interface OpExp {
    _type: 'OpExp';
    left: Expression;
    right: Expression;
    operator: Operator;
}

export interface FuncAppExp {
    _type: 'FuncAppExp';
    functionName: Token;
    args: Expression[];
}

export interface LiteralExp {
    _type: 'LiteralExp';
    literalType: 'number' | 'unimplemented';
    literalValue: string | number; // of course TODO
}

export type Expression = IfExp | VarExp | OpExp | LiteralExp | FuncAppExp;
