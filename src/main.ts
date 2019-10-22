import * as fs from 'fs';
import { tokenize } from './tokenizer';
import { makeSyntaxTree } from './syntax-tree';

function main() {
    let args = process.argv;
    // For now, the final argument is the filename.
    let filename = args[args.length - 1];

    let input = fs.readFileSync(filename).toString();

    let tokens = tokenize(input);

    let syntaxTree = makeSyntaxTree(tokens);

    //    console.log(tokens);
    console.log(syntaxTree);
}

main();
