import { isScaleDegree } from '../utils/scale-degree-utils';
import { isPitchLiteral } from '../utils/pitch-utils';
import { isRhythmLiteral } from '../utils/rhythm-utils';

export type Tokens = Token[];
export interface Token {
    tokenType: TokenType;
    value: InputSymbol;
}

/// Symbol is a reserved keyword so we have to be a little creative with the interface name here.
interface InputSymbol {
    line: number;
    column: number;
    value: string;
}

type TokenType =
    | 'angle-bracket'
    | 'bracket'
    | 'curly-bracket'
    | 'parens'
    | 'operator'
    | 'numeric-literal'
    | 'pitch-literal'
    | 'rhythm-literal'
    | 'pitch-rhythm-literal'
    | 'scale-degree-literal'
    | 'scale-degree-rhythm-literal'
    | 'assignment-operator'
    | 'eq-operator'
    | 'structural-keyword'
    | 'function-declaration'
    | 'loop-keyword'
    | 'type-keyword'
    | 'return-keyword'
    | 'type-ascription'
    | 'statement-terminator'
    | 'if'
    | 'comma'
    | 'then'
    | 'else'
    | 'boolean-literal'
    | 'name';

export function tokenize(input: string): Tokens {
    let symbols = splitOnSymbol(input);
    let tokens: Tokens = [];
    // Lookback of one symbol is needed to parse two-word note literals
    let prevSymbol = symbols[0];
    for (let i = 0; i < symbols.length; i++) {
        let symbol = symbols[i];
        const symbolValue = symbol.value;
        if (['(', ')'].includes(symbolValue)) {
            tokens.push({ tokenType: 'parens', value: symbol });
        } else if (['[', ']'].includes(symbolValue)) {
            tokens.push({ tokenType: 'bracket', value: symbol });
        } else if (['{', '}'].includes(symbolValue)) {
            tokens.push({ tokenType: 'curly-bracket', value: symbol });
        } else if (['+', '-', '/', '%', '*', '>', '<', '||', '&&'].includes(symbolValue)) {
            tokens.push({ tokenType: 'operator', value: symbol });
        } else if (symbolValue.match(new RegExp('^[0-9]+$'))) {
            tokens.push({ tokenType: 'numeric-literal', value: symbol });
        } else if (['fn'].includes(symbolValue)) {
            tokens.push({ tokenType: 'function-declaration', value: symbol });
        } else if (['for', 'while'].includes(symbolValue)) {
            tokens.push({ tokenType: 'loop-keyword', value: symbol });
        } else if (['='].includes(symbolValue)) {
            if (prevSymbol.value === '=') {
                // two equals in a row should be a boolean eq token
                // so we first get rid of the previous =
                tokens.pop();
                tokens.push({ tokenType: 'operator', value: { ...symbol, value: '==' } });
            } else {
                // otherwise, this is just an assigment operator.
                tokens.push({ tokenType: 'assignment-operator', value: symbol });
            }
        } else if ([';'].includes(symbolValue)) {
            tokens.push({ tokenType: 'statement-terminator', value: symbol });
        } else if (['if'].includes(symbolValue)) {
            tokens.push({ tokenType: 'if', value: symbol });
        } else if (['then'].includes(symbolValue)) {
            tokens.push({ tokenType: 'then', value: symbol });
        } else if (['else'].includes(symbolValue)) {
            tokens.push({ tokenType: 'else', value: symbol });
        } else if ([','].includes(symbolValue)) {
            tokens.push({ tokenType: 'comma', value: symbol });
        } else if (['true', 'false'].includes(symbolValue)) {
            tokens.push({ tokenType: 'boolean-literal', value: symbol });
        } else if (
            [
                'pitch',
                'degree',
                'number',
                'boolean',
                'chord',
                'duration',
                'list',
                'polyphony',
                'rhythm',
                'note',
                'song',
                'pitch_rhythm',
                'degree_rhythm',
            ].includes(symbolValue)
        ) {
            tokens.push({ tokenType: 'type-keyword', value: symbol });
        } else if (['compose', 'return'].includes(symbolValue)) {
            tokens.push({ tokenType: 'return-keyword', value: symbol });
        } else if ([':'].includes(symbolValue)) {
            tokens.push({ tokenType: 'type-ascription', value: symbol });
        } else if (isScaleDegree(symbolValue)) {
            tokens.push({ tokenType: 'scale-degree-literal', value: symbol });
        } else if (isPitchLiteral(symbolValue)) {
            tokens.push({ tokenType: 'pitch-literal', value: symbol });
        } else if (isRhythmLiteral(symbolValue)) {
            if (isPitchLiteral(prevSymbol.value)) {
                // replace the last token with pitch and rhythm
                tokens.pop();
                tokens.push({
                    tokenType: 'pitch-rhythm-literal',
                    value: {
                        line: prevSymbol.line,
                        column: prevSymbol.column,
                        value: `${prevSymbol.value} ${symbol.value}`,
                    },
                });
            } else if (isScaleDegree(prevSymbol.value)) {
                // replace the last token with scale degree and rhythm
                tokens.pop();
                tokens.push({
                    tokenType: 'scale-degree-rhythm-literal',
                    value: {
                        line: prevSymbol.line,
                        column: prevSymbol.column,
                        value: `${prevSymbol.value} ${symbol.value}`,
                    },
                });
            } else {
                tokens.push({ tokenType: 'rhythm-literal', value: symbol });
            }
        } else {
            // `name` here denotes that it is the name of either a function or a variable in the
            // environment.
            tokens.push({ tokenType: 'name', value: symbol });
        }
        prevSymbol = symbol;
    }
    return tokens;
}

/// Splits on any delimiter or symbol in the language and also
/// throws out any comments.
function splitOnSymbol(input: string): InputSymbol[] {
    // editors tend to 1-index line and column numbers
    let line = 1;
    let column = 1;
    let currentSymbol = '';
    let symbolsThusFar: InputSymbol[] = [];
    // Toggle "comment mode" when we encounter a -- until the end of the line.
    let commentLookback = false;
    let comment = false;
    for (const character of input) {
        // Special case handling for - since they could be indicating
        // a comment or a subtraction sign.
        if (commentLookback === true && comment === false && character !== '-') {
            symbolsThusFar.push({
                line,
                column: column - 1,
                value: '-',
            });
            commentLookback = false;
        }
        switch (character) {
            case '-':
                if (commentLookback === true) {
                    comment = true;
                } else {
                    commentLookback = true;
                    if (currentSymbol !== '') {
                        symbolsThusFar.push({
                            line,
                            column: column - currentSymbol.length,
                            value: currentSymbol,
                        });
                        currentSymbol = '';
                    }
                }
                break;
            case '(':
            case ')':
            case '[':
            case ']':
            case '{':
            case '}':
            case '<':
            case '>':
            case ':':
            case ';':
            case '+':
            case '=':
            case '/':
            case ',':
            case '%':
            case '*':
                if (!comment) {
                    if (currentSymbol !== '') {
                        symbolsThusFar.push({
                            line,
                            column: column - currentSymbol.length,
                            value: currentSymbol,
                        });
                    }
                    symbolsThusFar.push({
                        line,
                        column,
                        value: character,
                    });
                    currentSymbol = '';
                }
                break;
            case ' ':
            case '\t':
                if (!comment && currentSymbol !== '' && currentSymbol !== 'dotted') {
                    symbolsThusFar.push({
                        line,
                        column: column - currentSymbol.length,
                        value: currentSymbol,
                    });
                    currentSymbol = '';
                } else if (currentSymbol === 'dotted') {
                    currentSymbol = currentSymbol + ' ';
                }
                break;
            case '\n':
                if (!comment && currentSymbol !== '') {
                    symbolsThusFar.push({
                        line,
                        column: column - currentSymbol.length,
                        value: currentSymbol,
                    });
                }
                comment = false;
                commentLookback = false;
                currentSymbol = '';
                line = line + 1;
                column = 0;
                break;
            default:
                if (!comment) {
                    currentSymbol = currentSymbol + character;
                }
        }
        column = column + 1;
    }
    if (currentSymbol !== '') {
        symbolsThusFar.push({
            line,
            column: column - currentSymbol.length,
            value: currentSymbol,
        });
    }
    return symbolsThusFar;
}
