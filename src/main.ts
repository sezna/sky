import * as fs from 'fs';
import { tokenize } from './lexer/tokenizer';
import { isLeft } from 'fp-ts/lib/Either';
import { makeSyntaxTree } from './lexer/parser';

function main() {
    let args = process.argv;
    // For now, the final argument is the filename.
    let filename = args[args.length - 1];

    let input = fs.readFileSync(filename).toString();

    let tokens = tokenize(input);

    let res = makeSyntaxTree(tokens);
    
    if (isLeft(res)) {
      console.log(JSON.stringify(res, null, 2));
    }

    //    console.log(tokens);
    //console.log(JSON.stringify(syntaxTree, null, 2));
}

main();
