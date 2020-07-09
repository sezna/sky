import { tokenize } from './lexer/tokenizer';
import { makeSyntaxTree } from './lexer/parser';
import { runtime } from './runtime';
import { isLeft } from 'fp-ts/lib/Either';
import { render } from './xml-renderer';
import { RuntimeError } from './runtime';
import { ParseError } from './lexer/parser';

type CompileOk = { isOk: true; renderedXml: String };
type CompileErr = { isOk: false; err: RuntimeError | ParseError };
type CompileResponse = CompileOk | CompileErr;

export default function compile(sourceCode: string): CompileResponse {
    let tokens = tokenize(sourceCode);

    let syntaxTreeResult = makeSyntaxTree(tokens);
    if (isLeft(syntaxTreeResult)) {
        return { isOk: false, err: syntaxTreeResult.left! };
    }
    let result = runtime(syntaxTreeResult.right);
    if (isLeft(result)) {
        return { isOk: false, err: result.left };
    }

    // write result to filename.xml

    return { isOk: true, renderedXml: render(result.right) };
    /*
    let outputFilenameSplit = filename.split('.');
    outputFilenameSplit.pop();
    let outputFilename = outputFilenameSplit.join('.') + '.xml';
    fs.writeFileSync(outputFilename, render(result.right));
     */
}
