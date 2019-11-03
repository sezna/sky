import { tokenize, Tokens } from '../src/lexer/tokenizer';
import { isRight, isLeft, Right } from 'fp-ts/lib/Either';
import { consumeIfUntilThen, consumeThenUntilElse } from '../src/lexer/expression/consumers';

describe('consumer tests', () => {
    it('consumeIfUntilThen  should consume arbitrary tokens from between the if and then, but not consume the then itself', () => {
        let tokens = tokenize('if some arbitrary tokens are here then I succeed');
        let result = consumeIfUntilThen(tokens);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
        }
        expect(isRight(result)).toBe(true);
        result = result as Right<{ input: Tokens; tokens: Tokens }>;
        let contents = result.right.tokens;
        expect(contents).toHaveLength(5);
        expect(tokens[0].tokenType).toBe('then');
        expect(contents[4].value.value).toBe('here');
    });
    it('consumeThenUntilElse should consume arbitrary tokens between the then and the else but not the else itself', () => {
        let tokens = tokenize("then I don't know what else to do");
        let result = consumeThenUntilElse(tokens);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
        }
        expect(isRight(result)).toBe(true);
        result = result as Right<{ input: Tokens; tokens: Tokens }>;
        let contents = result.right.tokens;
        expect(contents).toHaveLength(4);
        expect(tokens[0].tokenType).toBe('else');
        expect(contents[3].value.value).toBe('what');
    });
    it('consumeThenUntilElse should consume arbitrary tokens between the then and a semicolon but not the semicolon itself', () => {
        let tokens = tokenize("then I don't know;");
        let result = consumeThenUntilElse(tokens);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
        }
        expect(isRight(result)).toBe(true);
        result = result as Right<{ input: Tokens; tokens: Tokens }>;
        let contents = result.right.tokens;
        expect(contents).toHaveLength(3);
        expect(tokens[0].tokenType).toBe('statement-terminator');
        expect(contents[2].value.value).toBe('know');
    });
});
