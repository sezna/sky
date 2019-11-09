import { isScaleDegree } from '../utils/scale-degree-utils';
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
    | 'scale-degree-literal'
    | 'assignment-operator'
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
    let symbols = splitOnSpaceOrDelimiter(input);
    let tokens: Tokens = [];
    for (const symbol of symbols) {
        const symbolValue = symbol.value;
        if (['(', ')'].includes(symbolValue)) {
            tokens.push({ tokenType: 'parens', value: symbol });
        } else if (['[', ']'].includes(symbolValue)) {
            tokens.push({ tokenType: 'bracket', value: symbol });
        } else if (['{', '}'].includes(symbolValue)) {
            tokens.push({ tokenType: 'curly-bracket', value: symbol });
        } else if (['+', '-', '/', '%', '*', '>', '<'].includes(symbolValue)) {
            tokens.push({ tokenType: 'operator', value: symbol });
        } else if (symbolValue.match(new RegExp('^[0-9]+$'))) {
            tokens.push({ tokenType: 'numeric-literal', value: symbol });
        } else if (['fn'].includes(symbolValue)) {
            tokens.push({ tokenType: 'function-declaration', value: symbol });
        } else if (['for', 'while'].includes(symbolValue)) {
            tokens.push({ tokenType: 'loop-keyword', value: symbol });
        } else if (['='].includes(symbolValue)) {
            tokens.push({ tokenType: 'assignment-operator', value: symbol });
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
                'notes',
                'polyphony',
                'rhythm',
                'note',
                'song',
            ].includes(symbolValue)
        ) {
            tokens.push({ tokenType: 'type-keyword', value: symbol });
        } else if (['compose'].includes(symbolValue)) {
            tokens.push({ tokenType: 'return-keyword', value: symbol });
        } else if ([':'].includes(symbolValue)) {
            tokens.push({ tokenType: 'type-ascription', value: symbol });
        } else if (isScaleDegree(symbolValue)) {
            tokens.push({ tokenType: 'scale-degree-literal', value: symbol });
        } else {
            // `name` here denotes that it is the name of either a function or a variable in the
            // environment.
            tokens.push({ tokenType: 'name', value: symbol });
        }
    }
    return tokens;
}

/// Splits on any delimiter or symbol in the language and also
/// throws out any comments.
function splitOnSpaceOrDelimiter(input: string): InputSymbol[] {
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
                if (!comment && currentSymbol !== '') {
                    symbolsThusFar.push({
                        line,
                        column: column - currentSymbol.length,
                        value: currentSymbol,
                    });
                    currentSymbol = '';
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
