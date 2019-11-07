import { Steps } from '../lexer/parser';
import { Either, right } from 'fp-ts/lib/Either';
import { ParseError } from '../lexer/parser';

interface SkyOutput {
    midi: String; // TODO
    sheetMusic: String; // TODO
}

export function runtime(tree: Steps): Either<ParseError, SkyOutput> {
    console.log(JSON.stringify(tree));

    return right({
        midi: '',
        sheetMusic: '',
    });
}
