import { tokenize, Tokens } from '../../src/lexer/tokenizer';
import { isRight, isLeft, Right } from 'fp-ts/lib/Either';
import {
    consumeIfUntilThen,
    consumeThenUntilElse,
    consumeAndLiftListContents,
    consumeWhileCondition,
} from '../../src/lexer/expression/consumers';
import { LiteralExp } from '../../src/lexer/expression';

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
            expect(true).toBe(false);
            return;
        }
        expect(isRight(result)).toBe(true);
        let contents = result.right.tokens;
        expect(contents).toHaveLength(3);
        expect(tokens[0].tokenType).toBe('statement-terminator');
        expect(contents[2].value.value).toBe('know');
    });
    it('consumeAndLiftListContents should consume the contents of a list and lift the inner elements into expressions', () => {
        let tokens = tokenize('[a2, a3, b1, b1, c4];');
        let result = consumeAndLiftListContents(tokens, [] as any, [] as any);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            expect(true).toBe(false);
            return;
        }
        let expressions = result.right.listContents;
        expect(expressions).toHaveLength(5);
        expect((expressions[0] as LiteralExp)._type).toBe('LiteralExp');
        expect((expressions[0] as LiteralExp).literalValue._type).toBe('LiteralPitch');
    });
    it('ConsumeAndLiftListContents should know the type of a nested list', () => {
        let tokens = tokenize('[[a2, a3, b1, b1, c4]];');
        let result = consumeAndLiftListContents(tokens, [] as any, [] as any);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            expect(true).toBe(false);
            return;
        }
        let expressions = result.right.listContents;
        expect(expressions).toHaveLength(1);
        expect((expressions[0] as LiteralExp)._type).toBe('LiteralExp');
        expect((expressions[0] as LiteralExp).literalValue._type).toBe('LiteralList');
    });
    it('ConsumeAndLiftListContents should know the type of a nested list of longer length', () => {
        let tokens = tokenize('[[a2, a3, b1, b1, c4], [c2, c2, c2, c2, c2]];');
        let result = consumeAndLiftListContents(tokens, [] as any, [] as any);
        if (isLeft(result)) {
            console.log(JSON.stringify(result, null, 2));
            expect(true).toBe(false);
            return;
        }
        let expressions = result.right.listContents;
        expect(expressions).toHaveLength(2);
        expect((expressions[0] as LiteralExp)._type).toBe('LiteralExp');
        expect((expressions[0] as LiteralExp).literalValue._type).toBe('LiteralList');
    });

    it('consume while condition should get only the condition out of a while loop', () => {
        let tokens = tokenize('while 5 == 5 { ');
        let whileToken = tokens.shift()!;

        expect(whileToken.value.value).toBe('while');
        let consumedResult = consumeWhileCondition(tokens);
        if (isLeft(consumedResult)) {
            console.log(JSON.stringify(consumedResult));
            expect(true).toBe(false);
            return;
        }

        let result = consumedResult.right;
        expect(result.condition[0].value.value).toBe('5');
        expect(result.condition[1].value.value).toBe('==');
        expect(result.condition[2].value.value).toBe('5');
        expect(result.condition[3].value.value).toBe(';');
        expect(result.condition).toHaveLength(4);
        expect(result.input[0].value.value).toBe('{');
    });
});
