import { Expression, parseExpression } from './expression/expression';
import { Either, right, left, isLeft } from 'fp-ts/lib/Either';
import { FunctionDeclaration } from './function-declaration';
import { VariableDeclaration } from './variable-declaration';
import { Token, Tokens } from './tokenizer';
import { ParseError } from './parser';

export interface Reassignment {
    _type: 'Reassignment';
    name: Token;
    newVarBody: Expression;
    indexes?: Expression[];
}

/**
 * Given a name and a new value, reassigns a variable within a namespace. (TODO should ensure the variable is of the same type as before.)
 */
export function reassignVariable(
    name: Token,
    input: Tokens,
    functionNamespace: FunctionDeclaration[],
    variableNamespace: VariableDeclaration[],
    indexExprs: Expression[],
): Either<ParseError, { input: Tokens; reassignment: Reassignment }> {
    let matches = variableNamespace.filter(x => x.varName.value.value === name.value.value);
    if (matches.length > 1) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `Multiple matching variable names in namespace for name ${name.value.value}. This should never happen and is an error in the compiler. Please file an issue at https://github.com/sezna/sky and include the code that triggered this error.`,
        });
    }
    if (matches.length == 0) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `No matching variable names in namespace for ${name.value.value}. This should never happen and is an error in the compiler. Please file an issue at https://github.com/sezna/sky and include the code that triggered this error.`,
        });
    }

    let equalsToken = input.shift()!;
    if (equalsToken === undefined) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `Expected equals sign in reassignment but instead found the end of a token stream.`,
        });
    }
    if (equalsToken.tokenType !== 'assignment-operator') {
        return left({
            line: equalsToken.value.line,
            column: equalsToken.value.column,
            reason: `Expected equals sign in reassignment but instead found "${equalsToken.value.value}" (${equalsToken.tokenType}).`,
        });
    }

    let newVarBodyResult = parseExpression(input, functionNamespace, variableNamespace);

    if (isLeft(newVarBodyResult)) {
        return newVarBodyResult;
    }

    let newVarBody = newVarBodyResult.right;
    // If there is any indexing going on, we want to note that the type has fewer dimensions.
    let reducedVarType = matches[0].varType.value.value
        .split(' ')
        .splice(indexExprs.length)
        .join(' ');

    if (reducedVarType !== newVarBody.expression.returnType) {
        return left({
            line: name.value.line,
            column: name.value.column,
            reason: `Attempted to assign value of type "${newVarBody.expression.returnType}" to variable "${matches[0].varName.value.value}", which has type "${reducedVarType}".`,
        });
    }

    return right({
        input: newVarBody.input,
        reassignment: {
            _type: 'Reassignment' as const,
            name,
            newVarBody: newVarBody.expression,
            indexes: indexExprs,
        },
    });
}
