import * as fs from 'fs';
import { tokenize } from './tokenizer';

function main() {
    let args = process.argv;
    // For now, the final argument is the filename.
    let filename = args[args.length - 1];

    let input = fs.readFileSync(filename).toString();

    let tokens = tokenize(input);

    console.log(tokens);
}

main();
