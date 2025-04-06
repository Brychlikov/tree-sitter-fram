#include "tree_sitter/parser.h"
#include "tree_sitter/alloc.h"
#include <ctype.h>
#include <stdint.h>
#include <string.h>

enum TokenType {
  BLOCK_COMMENT_START,
  BLOCK_COMMENT_TAG,
  BLOCK_COMMENT_REST,
  BLOCK_COMMENT_UNFINISHED,
  ERROR_SENTINEL,
};

#define MAX_TAG_LENGTH 30

typedef struct Scanner {
    // null-terminated array of unicode code points
    int32_t tag[MAX_TAG_LENGTH + 1];
    bool tagOpen;
    bool commentOpen;
} Scanner;

void *tree_sitter_fram_external_scanner_create() {
    return ts_calloc(1, sizeof(Scanner));
}

void tree_sitter_fram_external_scanner_destroy(void *payload) {
    ts_free(payload);
}

unsigned tree_sitter_fram_external_scanner_serialize(void *payload, char *buffer) {
    memcpy(buffer, payload, sizeof(Scanner));
    return sizeof(Scanner);
};

void tree_sitter_fram_external_scanner_deserialize(void *payload, char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;
    // tree-sitter requires us to zero-initialize the scanner regardless of buffer contents
    scanner->tag[0] = 0;
    scanner->tagOpen = false;
    scanner->commentOpen = false;

    // if there actually is deserialization data, just memcpy it
    if(length == sizeof(Scanner)) {
        memcpy(payload, buffer, sizeof(Scanner));
    }

};

static int tag_length(int32_t tag[MAX_TAG_LENGTH + 1]) {
    int result = 0;
    for(; result < MAX_TAG_LENGTH + 1; result++) {
        if(tag[result] == 0) {
            return result;
        }
    }
    return result;
}

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static inline bool is_whitespace(int codepoint) {
    return codepoint < 256 && isspace(codepoint);
}

static bool scan_block_comment_start(Scanner *scanner, TSLexer *lexer) {
    // consume {
    advance(lexer);
    // expect #
    if(lexer->lookahead != '#') {
        return false;
    }
    // consume #
    advance(lexer);

    scanner->tagOpen = true;
    scanner->commentOpen = true;
    lexer->result_symbol = BLOCK_COMMENT_START;
    return true;

}
   


static int ringbuf_match(int *ringbuf, int *pattern, int rindex, int rlen) {
    rindex = (rindex + 1) % rlen;
    for(int i=0; i < rlen; i++) {
        if(pattern[i] != ringbuf[(i + rindex) % rlen]){
            return i;
        }
    }
    return rlen;
}


bool tree_sitter_fram_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;


    // if we are in recovery mode and a comment is open, eat till the end of file
    if(valid_symbols[ERROR_SENTINEL]) {
        // else just bail
        if(!scanner->commentOpen) {
            return false;
        }

        while(!lexer->eof(lexer)) {
            advance(lexer);
        }
        lexer->result_symbol = BLOCK_COMMENT_UNFINISHED;
        return false;
    }

    // skip whitespace if not trying to parse a tag
    // no support for non-ASCII whitespace
    while(lexer->lookahead < 256 && isspace(lexer->lookahead) && !scanner->tagOpen){
        skip(lexer);
    }

    if(valid_symbols[BLOCK_COMMENT_START] &&
        (lexer->lookahead == '{')) {
        return scan_block_comment_start(scanner, lexer);
    }


    if(!(valid_symbols[BLOCK_COMMENT_TAG] || valid_symbols[BLOCK_COMMENT_REST])) {
        return false;
    }


    // try to read tag
    int i=0;
    if(scanner->tagOpen){
        for(; i < MAX_TAG_LENGTH; i++) {
            if(lexer->eof(lexer) || is_whitespace(lexer->lookahead)) {
                break;
            }
            scanner->tag[i] = lexer->lookahead;
            advance(lexer);
        }
        scanner->tag[i] = 0;
        scanner->tagOpen = false;
    }

    if(i > 0) {
        lexer->result_symbol = BLOCK_COMMENT_TAG;
        return true;
    }
       
    // yes, I use O(mn) pattern search
    // sue me
    int len = tag_length(scanner->tag);
    // pattern is '<tag>#}'
    // make a ringbuffer of same length as pattern
    int rlen = len + 2;
    int32_t ringbuf[rlen];
    memset(ringbuf, 0, rlen);
    int ri = 0;

    // prep pattern
    int32_t pattern[rlen];
    memcpy(pattern, scanner->tag, sizeof(int32_t) * len);
    pattern[len] = '#';
    pattern[len + 1] = '}';


    // search loop
    while(true) {
        if(lexer->eof(lexer)) {
            lexer->result_symbol = BLOCK_COMMENT_UNFINISHED;
            return true;
        }
        ringbuf[ri] = lexer->lookahead;
        advance(lexer);
        int matching = ringbuf_match(ringbuf, pattern, ri, rlen);
        ri = (ri + 1) % rlen;
        if(matching == rlen) {
            scanner->tagOpen = false;
            scanner->commentOpen = false;
            lexer->result_symbol = BLOCK_COMMENT_REST;
            return true;
        }
    }
}
