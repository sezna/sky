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

    console.log('giving to parseExpression: ', input.map(x => x.value.value));
    let parseResult = parseExpression(input, functionNamespace, variableNamespace);
    //  console.log('parseExpression returned', (parseResult as any).right.map((x: Token) => x.value.value));
    if (isLeft(parseResult)) {
        return parseResult;
    }

    // If this is a list, type inference for the inner type is supported.
    // If auto type inferencing for vars was ever to be supported, this line
    // is what performs the inference based off of the RHS.
    if (varType.value.value === 'list') {
        let exprVarType = parseResult.right.expression.returnType;
        varType.value.value = exprVarType;
    }

    if (varType.value.value !== parseResult.right.expression.returnType) {
        return left({
            line: varType.value.line,
            column: varType.value.column,
            reason: `Variable "${varName.value.value}" is declared with type "${varType.value.value}" but the expression assigned to it returns type "${parseResult.right.expression.returnType}"`,
        });
    }

    return right({
        input: input,
        declaration: {
            _type: 'VariableDeclaration',
            varName,
            varBody: parseResult.right.expression, // TODO
            varType,
        },
    });
}
