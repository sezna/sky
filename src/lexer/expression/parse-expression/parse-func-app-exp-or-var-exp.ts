import { ParseError } from '../../parser';
import { Tokens } from '../../tokenizer';
import { isLeft, Either, left, right } from 'fp-ts/lib/Either';
import { parseExpression } from './';
import { Expression } from '../expression-types';
import { VariableDeclaration } from '../../variable-declaration';
import { FunctionDeclaration } from '../../function-declaration';

/**
 * This is an ugly file name and an ugly function, but it turns out to be  a very dense
 * and specific piece of parsing logic that is unfortunately necessary. I've done my best to
 * contain it all to this one file.
 *
 * Given a 'name' token, it looks up the matching function and variable declarations in the namespaces it has been given. If the variable or function doesn't exist, it returns an error. Otherwise, it either returns a VarExp or it continues consuming until all of the FuncAppExp args have been consumed and returns a FuncAppExp.
 *
 * This is complicated because sky tries to fail early if an uninitialized variable or function is used. Here, sky fails in the initial parse if it detects an unidentifiable symbol. This is useful for things like editor plugins which need to continuously run the parser/compiler for various features.
 *
 */
export function parseFuncAppExpOrVarExp(
    expressionContents: Tokens,
    functionNamespace: FunctionDeclaration[],
    variableNamespace: VariableDeclaration[],
): Either<ParseError, { remainingExpressionContents: Tokens; expression: Expression }> {
    let matchingVariables = variableNamespace.filter(x => x.varName.value.value === expressionContents[0].value.value);
    let matchingFunctions = functionNamespace.filter(
        x => x.functionName.value.value === expressionContents[0].value.value,
    );
    // If nothing in the namespace matched, then this is an undeclared variable.
    if (matchingVariables.length === 0 && matchingFunctions.length === 0) {
        return left({
            line: expressionContents[0].value.line,
            column: expressionContents[0].value.column,
            reason: `Identifier "${expressionContents[0].value.value}" has not been declared`,
        });
    }
    // As an invariant, there should never be more than one thing in either of these arrays, and at least one
    // of them must have a length of zero.
    if (matchingVariables.length > 0 && matchingFunctions.length > 0) {
        return left({
            line: expressionContents[0].value.line,
            column: expressionContents[0].value.column,
            reason: `Ambiguous name: "${expressionContents[0].value.value}" could be either a variable (defined on line ${matchingVariables[0].varName.value.line}) or a function (defined on line ${matchingFunctions[0].functionName.value.line})`,
        });
    }
    if (matchingVariables.length > 1 || matchingFunctions.length > 1) {
        return left({
            line: expressionContents[0].value.line,
            column: expressionContents[0].value.column,
            reason: `Multiple matches in environment for name "${expressionContents[0].value.value}"`,
        });
    }
    if (matchingVariables.length > 0) {
        return right({
            remainingExpressionContents: expressionContents,
            expression: {
                _type: 'VarExp',
                varName: expressionContents[0],
            },
        });
        expressionContents.shift();
    } else if (matchingFunctions.length === 1) {
        // get the args out of the following parenthesis
        const numberOfArgs = matchingFunctions[0].args.length;
        const functionName = matchingFunctions[0].functionName;
        let rover = expressionContents[0];
        let args: Expression[] = [];
        // Special case handling for no argument functions to skip the whole arg parsing phase
        let name = expressionContents.shift()!;
        if (numberOfArgs === 0) {
            let leftParens = expressionContents.shift();
            let rightParens = expressionContents.shift();
            if (
                leftParens === undefined ||
                rightParens === undefined ||
                leftParens.value.value !== '(' ||
                rightParens.value.value !== ')'
            ) {
                return left({
                    line: name.value.line,
                    column: name.value.column,
                    reason: `Malformed function application. It should look like this: ${name.value.value}(), as the function ${name.value.value} takes no arguments.`,
                });
            }
        }
        const leftParens = expressionContents.shift();
        if (leftParens === undefined) {
            return left({
                line: name.value.line,
                column: name.value.column,
                reason: `Unexpected EOF after function name "${name.value.value}". Expected an opening parenthesis "("`,
            });
        }
        if (leftParens.value.value !== '(') {
            return left({
                line: name.value.line,
                column: name.value.column,
                reason: `Expected an opening parenthesis "(" after function name "${name.value.value}". Instead, received a "${leftParens.value.value}".`,
            });
        }
        while (args.length < numberOfArgs) {
            let prevToken = rover;
            rover = expressionContents.shift()!;
            if (rover === undefined) {
                return left({
                    line: prevToken.value.line,
                    column: prevToken.value.column,
                    reason: `Unexpected end of expression while parsing arguments for function "${functionName.value.value}." Expected ${numberOfArgs} arguments, but only received ${args.length} arguments.`,
                });
            }
            // there could be any sort of expression between here and the next comma
            // so we first consume until the next comma if this is not the last arg,
            // and until the last closing parens if it is the last arg
            // ```
            // foo(a, b, c)
            // ``` ^ we are parsing this part right now.
            //       notice that the "terminator" of this expression is a comma if the
            //       current arg is not the last argument
            //
            // Now we handle the case where there is a nested expression in the function
            // application, like this:
            // foo(bar(x + 20, b), 10, (c / 2))
            const isLastArg = args.length + 1 === numberOfArgs;
            const terminator = isLastArg ? 'parens' : 'comma';

            if (terminator === 'parens') {
                let openingParensCount = 1;
                let closingParensCount = 0;

                let expressionBuffer = [];
                while (openingParensCount > closingParensCount) {
                    expressionBuffer.push(rover);
                    prevToken = rover;
                    rover = expressionContents.shift()!;
                    if (rover.value.value === '(') {
                        openingParensCount += 1;
                    } else if (rover.value.value === ')') {
                        closingParensCount += 1;
                    }
                }
                // This is not optimal, but we need to add a semicolon to every expression in the function args
                // in order for the parse to work.
                expressionBuffer.push({
                    tokenType: 'statement-terminator' as const,
                    value: {
                        line: 0,
                        column: 0,
                        value: ';',
                    },
                });
                let result = parseExpression(expressionBuffer, functionNamespace, variableNamespace);
                if (isLeft(result)) {
                    return result;
                }
                args.push(result.right.expression);
            } else if (terminator === 'comma') {
                let openingParensCount = 0;
                let closingParensCount = 0;
                let seenOuterComma = false;
                let expressionBuffer = [];
                while (!seenOuterComma) {
                    if (rover.value.value === '(') {
                        openingParensCount += 1;
                    } else if (rover.value.value === ')') {
                        closingParensCount += 1;
                    }
                    // If we have seen an "outer comma", i.e. a comma outside of any inner expressions
                    //
                    //            inner comma
                    //               |
                    //               V
                    // foo (x, (bar(2, 10)), z);
                    //       ^             ^
                    //       |             |
                    //   outer comma   outer comma
                    //
                    if (rover.tokenType !== 'comma') {
                        expressionBuffer.push(rover);
                    }

                    rover = expressionContents.shift()!;
                    if (rover === undefined) {
                        return left({
                            line: prevToken.value.line,
                            column: prevToken.value.column,
                            reason: `Unexpected end of expression while parsing arguments for function "${functionName.value.value}." Expected ${numberOfArgs} arguments, but only received ${args.length} arguments.`,
                        });
                    }
                    seenOuterComma = openingParensCount === closingParensCount && rover.tokenType === 'comma';
                    prevToken = rover;
                }
                // This is not optimal, but we need to add a semicolon to every expression in the function args
                // in order for the parse to work.
                expressionBuffer.push({
                    tokenType: 'statement-terminator' as const,
                    value: {
                        line: 0,
                        column: 0,
                        value: ';',
                    },
                });

                let result = parseExpression(expressionBuffer, functionNamespace, variableNamespace);
                if (isLeft(result)) {
                    return result;
                }
                args.push(result.right.expression);
            }
        }
        // Now we have the arguments and the function name, so we can add it to the expression stack.
        return right({
            remainingExpressionContents: expressionContents,
            expression: {
                _type: 'FuncAppExp',
                functionName,
                args,
            },
        });
    }
    return left({
        line: (expressionContents[0] && expressionContents[0].value.line) || 0,
        column: (expressionContents[0] && expressionContents[0].value.column) || 0,
        reason: `Failed to parse FuncAppExp or VarExp out of name ${expressionContents[0].value.value}. This is probably a bug in the compiler. Please file an issue at https://github.com/sezna/sky with the code that caused this error.`,
    });
}
