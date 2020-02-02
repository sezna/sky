import { tokenize, Tokens } from '../../src/lexer/tokenizer';

describe('Tokenizer tests', () => {
    it('Should tokenize the correct number of tokens', () => {
        let tokens: Tokens = tokenize('number x = 20 + (10 - 4) * 3 - (2 * (1 - 4));');
        expect(tokens).toHaveLength(23);
    });
    it('Should tokenize parenthesis as their own token', () => {
        let tokens: Tokens = tokenize('(( (      ( ) () test )))))))))))');
        expect(tokens).toHaveLength(19);
    });
    it('Should be able to differentiate between comments and minus signs', () => {
        let tokens: Tokens = tokenize('-- this should have zero tokens');
        expect(tokens).toHaveLength(0);
    });
    it('Should ignore minus signs even inside of a comment', () => {
        let tokens: Tokens = tokenize('-- this - should be ignored even if it looks - (like * an) / expression');
        expect(tokens).toHaveLength(0);
    });
    it('Should handle expressions with no spaces', () => {
        let tokens: Tokens = tokenize('20-10+x-y/20');
        expect(tokens).toHaveLength(9);
        expect(tokens[0].value.value).toBe('20');
        expect(tokens[1].value.value).toBe('-');
        expect(tokens[2].value.value).toBe('10');
        expect(tokens[3].value.value).toBe('+');
        expect(tokens[4].value.value).toBe('x');
        expect(tokens[5].value.value).toBe('-');
        expect(tokens[6].value.value).toBe('y');
        expect(tokens[7].value.value).toBe('/');
        expect(tokens[8].value.value).toBe('20');
    });
    it('should tokenize a note literal with a rhythm as one token', () => {
        let tokens: Tokens = tokenize('c#4 quarter');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].value.value).toBe('c#4 quarter');
        expect(tokens[0].tokenType).toBe('pitch-rhythm-literal');
    });
    it('should tokenize a note literal with a rhythm as a pitch-rhythm-literal', () => {
        let tokens: Tokens = tokenize('Db3 half');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('pitch-rhythm-literal');
    });
    it('should tokenize a scale degree literal correctly', () => {
        let tokens: Tokens = tokenize('iii');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('scale-degree-literal');
    });
    it('should tokenize a scale degree and a rhythm', () => {
        let tokens: Tokens = tokenize('iv whole');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('scale-degree-rhythm-literal');
    });
    it('should recognize the word "dotted" as part of a rhythm', () => {
        let tokens: Tokens = tokenize('iv dotted whole');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('scale-degree-rhythm-literal');
    });
    it('should tokenize two equals as one operator', () => {
        let tokens: Tokens = tokenize('==');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('operator');
    });
    it('should tokenize two equals (even if there is a space) as one eq-operator', () => {
        let tokens: Tokens = tokenize('= =');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('operator');
    });
    it('should tokenize nested lists as one typename token', () => {
        let tokens = tokenize('list list pitch_rhythm');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('type-keyword');
        expect(tokens[0].value.value).toBe('list list pitch_rhythm');
    });
    it('should tokenize triply nested lists as one typename token', () => {
        let tokens = tokenize('list list list pitch_rhythm');
        expect(tokens).toHaveLength(1);
        expect(tokens[0].tokenType).toBe('type-keyword');
        expect(tokens[0].value.value).toBe('list list list pitch_rhythm');
    });
});
