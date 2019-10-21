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
    | 'assignment-operator'
    | 'structural-keyword'
    | 'name';

export function tokenize(input: string): Tokens {
    let symbols = splitOnSpaceOrDelimiter(input);
    let tokens: Tokens = [];
    for (const symbol of symbols) {
        const symbolValue = symbol.value;
        if ('()'.includes(symbolValue)) {
            tokens.push({ tokenType: 'parens', value: symbol });
        } else if ('[]'.includes(symbolValue)) {
            tokens.push({ tokenType: 'bracket', value: symbol });
        } else if ('{}'.includes(symbolValue)) {
            tokens.push({ tokenType: 'curly-bracket', value: symbol });
        } else if ('<>'.includes(symbolValue)) {
            tokens.push({ tokenType: 'angle-bracket', value: symbol });
        } else if ('+-/%*'.includes(symbolValue)) {
            tokens.push({ tokenType: 'operator', value: symbol });
        } else if (symbolValue.match(new RegExp('^[0-9]*$'))) {
            tokens.push({ tokenType: 'numeric-literal', value: symbol });
        } else if (['let', 'for', 'while', 'fn'].includes(symbolValue)) {
            tokens.push({ tokenType: 'structural-keyword', value: symbol });
        } else if ('='.includes(symbolValue)) {
            tokens.push({ tokenType: 'assignment-operator', value: symbol });
        } else {
            // `name` here denotes that it is the name of either a function or a variable in the
            // environment.
            tokens.push({ tokenType: 'name', value: symbol });
        }
    }
    return tokens;
}

function splitOnSpaceOrDelimiter(input: string): InputSymbol[] {
    let line = 0;
    let column = 0;
    let currentSymbol = '';
    let symbolsThusFar: InputSymbol[] = [];
    for (const character of input) {
        switch (character) {
            case '(':
            case ')':
            case '[':
            case ']':
            case '{':
            case '}':
            case '<':
            case '>':
                symbolsThusFar.push({
                    line,
                    column,
                    value: character,
                });
                break;
            case ' ':
                symbolsThusFar.push({
                    line,
                    column,
                    value: currentSymbol,
                });
                currentSymbol = '';
                break;
            case '\n':
                symbolsThusFar.push({
                    line,
                    column,
                    value: currentSymbol,
                });
                currentSymbol = '';
                line = line + 1;
                column = 0;
                break;
            default:
                currentSymbol = currentSymbol + character;
        }
        column = column + 1;
    }
    return symbolsThusFar;
}
