import { tokenize } from './lexer/tokenizer';
import { makeSyntaxTree } from './lexer/parser';
import { runtime } from './runtime';
import { isLeft } from 'fp-ts/lib/Either';
import { render } from './xml-renderer';
import { RuntimeError } from './runtime';
import { ParseError } from './lexer/parser';
import { Tokens } from './lexer/tokenizer';
import fs from "fs";
import http from "http";

type CompileOk = { isOk: true; renderedXml: String };
type CompileErr = { isOk: false; err: RuntimeError | ParseError };
type CompileResponse = CompileOk | CompileErr;

export default function compile(sourceCode: string): CompileResponse {
    let tokens = tokenize(sourceCode);

    //  pull the imports from either locally or the package registry
    let indexesToRemove = [];
  let codeToInclude: Tokens = [];
    for (let i = 0; i < tokens.length - 3; i++) {
      if (tokens[i].value.value === 'import') {
        let localOrRemote = tokens[i + 1];
        let packageName = tokens[i + 2];
        let semicolon = tokens[i + 3];
        if (!['local', 'remote'].includes(localOrRemote.value.value)) {
          return {
            isOk: false,
            err: { line: localOrRemote.value.line, column: localOrRemote.value.column, reason: `incorrect import syntax: should be of the format \`import [remote or local] package_name\`, e.g.: \`import remote stdlib\`` }
          };
        }

        if (semicolon.value.value !== ';') {
          return { isOk: false,
            err: { line: semicolon.value.line, column: semicolon.value.column, reason: 'incorrect import syntax: import statement should be followed by a semicolon' }
          }
        }

        indexesToRemove.push(i);
        indexesToRemove.push(i + 1);
        indexesToRemove.push(i + 2);
        indexesToRemove.push(i + 3);

        if (localOrRemote.value.value === 'remote') {
          // make http request for package
          // TODO: https://www.npmjs.com/package/sync-request
          http.get(packageName.value.value);
        }
        else if (localOrRemote.value.value === 'local') {
          let content = fs.readFileSync(packageName.value.value, 'utf8')
          let includingTokens = tokenize(content);
          codeToInclude = [...codeToInclude , ...includingTokens]; 
        }
      }
    }
    tokens = [...codeToInclude,  ...tokens];

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
