import * as fs from 'fs';
import { tokenize } from './lexer/tokenizer';
import { makeSyntaxTree } from './lexer/parser';

function main() {
    let args = process.argv;
    // For now, the final argument is the filename.
    let filename = args[args.length - 1];

    let input = fs.readFileSync(filename).toString();

    let tokens = tokenize(input);

    makeSyntaxTree(tokens);

    //    console.log(tokens);
    //console.log(JSON.stringify(syntaxTree, null, 2));
}

main();
