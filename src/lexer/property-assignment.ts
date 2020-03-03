import { Expression } from './expression/expression';
import { Either, right, left } from 'fp-ts/lib/Either';
import { Token, Tokens } from './tokenizer';
import { ParseError } from './parser';

export interface PropertyAssignment {
    _type: 'PropertyAssignment';
    varName: Token;
    indexes?: Expression[];
    propertyName: Token;
    value: string;
}

/* Method invocation, or in reality property assignment, should just parse the following sequence (varName has already been parsed):
 * - the period after the name
 * - the name of the property or property (right now we will probably only support properties)
 * - an equals sign
 * - either a string (TODO -- strings are unimplemented) or one of a preset set of "Atoms"?
 */
export function propertyAssignment(
    name: Token,
    input: Token[],
    indexExprs: Expression[],
): Either<ParseError, { input: Tokens; propertyAssignment: PropertyAssignment }> {
    const dot = input.shift()!;
    if (dot === undefined || dot.tokenType !== 'property') {
        return left({
            line: dot.value.line,
            column: dot.value.column,
            reason: `Attempted to call property assignment on a statement which was not a property assignment. This is probably a bug in the compiler. Please file an issue at https://github.com/sezna/sky and include the code that caused this.`,
        });
    }

    const propertyName = input.shift()!;
    if (propertyName === undefined || propertyName.tokenType !== 'name') {
        return left({
            line: dot.value.line,
            column: dot.value.column,
            reason: `Expected the name of a property, but instead received ${
                propertyName === undefined ? 'nothing' : `"${propertyName.value.value}"`
            }.`,
        });
    }

    const equals = input.shift()!;
    if (equals === undefined || equals.tokenType !== 'assignment-operator') {
        return left({
            line: equals.value.line,
            column: equals.value.column,
            reason: `Expected an equals sign, but instead received ${
                equals === undefined ? 'nothing' : `"${equals.value.value}"`
            }.`,
        });
    }

    // Consume until a semicolon.
    let rover = input.shift!();
    if (rover === undefined) {
        return left({
            line: equals.value.line,
            column: equals.value.column,
            reason: `Expected a property value for property "${name}.${propertyName}".`,
        });
    }
    let valueBuffer = [];
    while (rover.tokenType !== 'statement-terminator') {
        valueBuffer.push({ ...rover });
        const prevRover = { ...rover };
        rover = input.shift()!;
        if (rover === undefined) {
            return left({
                line: prevRover.value.line,
                column: prevRover.value.column,
                reason: `Expected a semicolon to terminate property value for property "${name}.${propertyName}".`,
            });
        }
    }
    let value = valueBuffer.map(x => x.value.value).join(' ');

    // This is where there are only a certain amount of pre-defined names that can go here. They aren't string literals, they're something else.
    // in the future, there can also be string literal values for certain metadata properties like author, etc.
    // Currently this is a TODO and is very much not exhaustive.
    let allowedPropertyValues = [
        'bass',
        'treble',
        'alto',
        'tenor',
        'pianissimo',
        'piano',
        'mezzo piano',
        'mezzo forte',
        'forte',
        'fortissimo',
        // instruments
        'flute',
        'piano',
        'guitar',
        'contrabass',
        'cello',
    ];
    // Properties which can accept any string as a value
    let wildcardProperties = ['composer', 'title'];

    if (!wildcardProperties.includes(propertyName.value.value) && !allowedPropertyValues.includes(value)) {
        return left({
            line: valueBuffer[0].value.line,
            column: valueBuffer[0].value.column,
            reason: `Value "${value}" is not a valid property value for property "${propertyName.value.value}".`,
        });
    }

    return right({
        input,
        propertyAssignment: {
            _type: 'PropertyAssignment',
            varName: name,
            propertyName,
            value,
            indexes: indexExprs,
        },
    });
}
