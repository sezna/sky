import * as fs from 'fs';
import { tokenize } from './lexer/tokenizer';
import { makeSyntaxTree } from './lexer/parser';
import { runtime } from './runtime';
import { isLeft } from 'fp-ts/lib/Either';

function main() {
    let args = process.argv;
    // For now, the final argument is the filename.
    let filename = args[args.length - 1];

    let input = fs.readFileSync(filename).toString();

    let tokens = tokenize(input);

    let syntaxTree = makeSyntaxTree(tokens);
    if (isLeft(syntaxTree)) {
        return;
    }
    let result = runtime(syntaxTree.right);
    console.log(JSON.stringify(result, null, 2));
}

main();
