import { right, isLeft, left, Either } from 'fp-ts/lib/Either';
import { Tokens, Token } from './tokenizer';
import { ParseError } from './parser';
import { Expression, parseExpression } from './expression/expression';
import { FunctionDeclaration } from './function-declaration';
export interface VariableDeclaration {
    _type: 'VariableDeclaration';
    varName: Token;
    varBody: Expression;
    varType: Token; // type name TODO
}

export function variableDeclaration(
    input: Tokens,
    functionNamespace: FunctionDeclaration[],
    variableNamespace: VariableDeclaration[],
): Either<ParseError, { input: Tokens; declaration: VariableDeclaration }> {
    // we know this is defined because this function is never called on an empty input
    // it is only triggered by typenames in the parser
    let varType = input.shift()!;

    let prevToken = varType;
    let varName = input.shift()!;
    if (varName === undefined) {
        return left({
            line: prevToken.value.line,
            column: prevToken.value.column,
            reason: `Received EOF during variable declaration.`,
        });
    }

    const conflictingFunctionNames = functionNamespace.filter(x => x.functionName.value.value === varName.value.value);
    if (conflictingFunctionNames.length > 0) {
        return left({
            line: varName.value.line,
            column: varName.value.column,
            reason: `Variable name "${varName.value.value}" conflicts with function of the same name at line ${conflictingFunctionNames[0].functionName.value.line}, column ${conflictingFunctionNames[0].functionName.value.column}`,
        });
    }
    const conflictingVariableNames = variableNamespace.filter(x => x.varName.value.value === varName.value.value);

    if (conflictingVariableNames.length > 0) {
        return left({
            line: varName.value.line,
            column: varName.value.column,
            reason: `Variable name "${varName.value.value}" conflicts with variable of the same name at line ${conflictingVariableNames[0].varName.value.line}, column ${conflictingVariableNames[0].varName.value.column}`,
        });
    }
    prevToken = varName;
    let equals = input.shift();
    if (equals === undefined) {
        return left({
            line: prevToken.value.line,
            column: prevToken.value.column,
            reason: `Incomplete variable declaration for variable "${varName.value.value}"`,
        });
    }
    if (equals.tokenType !== 'assignment-operator') {
        return left({
            line: equals.value.line,
            column: equals.value.column,
            reason: `Expected an equals sign ("=") after variable name "${varName.value.value}", but instead received "${equals.value.value}."`,
        });
    }

    // TODO here is where we need to parse an expression or figure out how the declaration terminates
    let parseResult = parseExpression(input, functionNamespace, variableNamespace);
    if (isLeft(parseResult)) {
        return parseResult;
    }

    return right({
        input: input,
        declaration: {
            _type: 'VariableDeclaration',
            varName,
            varBody: parseResult.right.expression, // TODO
            varType: varType,
        },
    });
}
