## Project overview
This is a tree-sitter grammar for the Fram experimental research language.
Fram uses a ML-like grammar.
More info on Fram, and its current implementation, `dbl`: https://github.com/fram-lang/dbl

You can access dbl in directory `../scratch-dbl/`

Fram requires an external tokenizer to parse comments, see `src/scanner.c`
Grammar is written in `./grammar.js`, the rest of files is largely unimportant.

## Development
- this uses a nix dev environment to manage dependencies
    * same goes for `../scratch-dbl/`
- we have two test kinds:
    * built-in tree-sitter unit tests
    * `./test_if_parses.sh`, which runs all files from `dbl` test suite to check if they parse successfuly, but without checking the result itself

## Important commands

- `nix develop`
-  `./test_if_parses.sh ../scratch-dbl/test/ok/* | grep failed`
- `tree-sitter build`
- `tree-sitter test`
- `tree-sitter parse`
