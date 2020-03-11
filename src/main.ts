import * as fs from 'fs';
import { tokenize } from './lexer/tokenizer';
import { makeSyntaxTree } from './lexer/parser';
import { runtime } from './runtime';
import { isLeft } from 'fp-ts/lib/Either';
import { render } from './abc-renderer';

function main() {
    let args = process.argv;
    // For now, the final argument is the filename.
    let filename = args[args.length - 1];

    let input = fs.readFileSync(filename).toString();

    let tokens = tokenize(input);

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

    console.log(render(result.right));
}

main();
