import { tokenize } from './lexer/tokenizer';
import { makeSyntaxTree } from './lexer/parser';
import { runtime } from './runtime';
import { isLeft } from 'fp-ts/lib/Either';
import { render } from './xml-renderer';

export default function compile(sourceCode: string) {
    /*
    let args = process.argv;
    // For now, the final argument is the filename.
    let filename = args[args.length - 1];

    let input = fs.readFileSync(filename).toString();
   */

    let tokens = tokenize(sourceCode);

    let syntaxTreeResult = makeSyntaxTree(tokens);
    if (isLeft(syntaxTreeResult)) {
        console.log(`Parse error at line ${syntaxTreeResult.left.line}, column ${syntaxTreeResult.left.column}:
${syntaxTreeResult.left.reason}`);
        return;
    }
    let result = runtime(syntaxTreeResult.right);
    if (isLeft(result)) {
        console.log(`Compilation error at line ${result.left.line}, column ${result.left.column}:
${result.left.reason}`);
        return;
    }

    // write result to filename.xml

    return render(result.right);
    /*
    let outputFilenameSplit = filename.split('.');
    outputFilenameSplit.pop();
    let outputFilename = outputFilenameSplit.join('.') + '.xml';
    fs.writeFileSync(outputFilename, render(result.right));
     */
}
