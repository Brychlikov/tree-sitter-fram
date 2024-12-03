/**
 * @file Fram programming language
 * @author Brych <brychlikow@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-nocheck

module.exports = grammar({
  name: "fram",

  word: $ => $.lid,

  extras: $ => [
    $.block_comment,
    $.test_comment,
    /\s/,
  ],


  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => seq(repeat($.imprt), optional($.def_list)),
    _digit: $ => /[0-9]/,
    _lid_start: $ => /[a-z_]/,
    _uid_start: $ => /[A-Z]/,
    _var_char: $ => choice($._lid_start, $._uid_start, $._digit, '\''),
    _op_char: $ => /[<>&$#?!@^+~*%;,=|:./]|-/,
    lid: _ => /[a-z_][a-zA-Z_0-9']*/,
    uid: _ => /[A-Z][a-zA-Z_0-9']*/,
    tlid: _ => /~[a-z_][a-zA-Z_0-9']*/,
    qlid: _ => /\?[a-z_][a-zA-Z_0-9']*/,
    op: $ => /([<>&$#?!@^+~*%;,=|:./]|-)+/,
    num: _ => /(0[bB][01]+|0[oO][0-7]+|[0-9]+|0[xX][0-9a-fA-F]+)/,
    num64: _ => /(0[bB][01]+|0[oO][0-7]+|[0-9]+|0[xX][0-9a-fA-F]+)L/,
    // TODO: escapes
    str: _ => /".*"/,
    chr: _ => /'.'/,

    // comment: _ => /\(\*.*(\n.*)*.*\*\)/,
    block_comment: $ => seq(
      "(*",
      optional($.comment_text),
      "*)"
    ),
    comment_text: $ => repeat1(/.|\n|\r/),

    test_comment: $ => /\/\/.*\n/,

    _name: $ => choice(
      $.label, 
      $.lid,
      $.qlid,
      $.tlid,
      $.method,
    ),
    label: $ => "label",
    method: $ => seq("method", $.lid),

    def_list: $ => repeat1($._def),
    _def: $ => prec.left(11, choice( 
      $.def_let,
      $.def_implicit,
      $.def_data,
      $.def_data_record,
      // $.def_label,
      $.def_handle,
      $.def_handle_with,
      $.def_method,
      $.def_module,
      $.def_rec,
      $.def_open,
    )),

    var_id: $ => prec(2, choice(
      $.lid,
      seq("(", $.op, optional("."), ")")
    )),

    def_rec: $ => seq("rec", $.def_list, "end"),

    def_method: $ => choice(
      seq(optional("pub"), "method", optional("rec"), $._expr, "=", $._expr),
      seq(optional("pub"), "method", "fn", $.var_id, optional(seq("=", $.var_id))),
    ),

    def_module: $ => seq(optional("pub"), "module", optional("rec"), $.uid, $.def_list, "end"),

    def_open: $ => seq(optional("pub"), "open", $.uid_path),

    def_let: $ => prec.left(11, seq(optional("pub"), "let", optional("rec"), $._expr,  "=", $._expr)),

    def_data: $ => seq(optional($.data_vis), "data", optional("rec"), $._ty_expr, "=", optional("|"), optional($._ctor_decls1)),

    def_data_record: $ => seq(optional($.data_vis), "data", optional("rec"), $._ty_expr, "=", $.ty_record),
    data_vis: $ => prec(2, choice("pub", "abstr")),

    def_handle: $ => seq(optional("pub"), "handle", optional("rec"), $._expr, "=", $._expr, repeat($._h_clause)),

    def_handle_with: $ => seq(optional("pub"), "handle", optional("rec"), $._expr, "with", $._expr),

    def_implicit: $ => seq("implicit", $.tlid, optional($.implicit_ty_args), optional($.type_annot)),

    import_path_rel: $ => seq($.uid, repeat(seq("/", $.uid))),
    import_path_abs: $ => seq("/", $.uid, repeat(seq("/", $.uid))),
    _import_path: $ => choice($.import_path_abs, $.import_path_rel),

    open: $ => "open",
    imprt: $ => seq("import", optional($.open), $._import_path, optional(seq("as", $.uid))),


    implicit_ty_args: $ => seq("{", repeat1($._ty_expr), "}"),
    type_annot: $ => seq(":", $._ty_expr),

    h_return: $ => seq("return", $._expr, "=>", $._expr),
    h_finally: $ => seq("finally", $._expr, "=>", $._expr),
    _h_clause: $ => choice($.h_return, $.h_finally),


    _ctor_decls1: $ => seq($.ctor_decl, repeat(seq("|", $.ctor_decl))),

    ctor_decl: $ => choice(
      $._ctor_name,
      seq($._ctor_name, "of", $._ty_expr_list),
    ),
    
    _ty_expr_list: $ => seq($._ty_expr, repeat(seq(",", $._ty_expr))),

    ctor_unit: _ => "()",
    ctor_nil: _ => "[]",

    _ctor_name: $ => choice(
      $.ctor_unit,
      $.ctor_nil,
      $.uid,
      seq("(", $.op, ")"),
      seq("(", $.op, ".)"),
    ),

    _ty_expr: $ => choice(
      $.ty_expr_arr,
      $._ty_expr_simple,
      $.ty_expr_app,
      $.ty_expr_effect,
      $.ty_expr_type,
    ),

    ty_expr_effect: $ => seq("effect", $._ty_expr_simple),
    ty_expr_type: $ => seq("type", $._ty_expr_simple),

    uid_path: $ => seq($.uid, repeat(seq(".", $.uid))),


    ty_expr_arr: $ => prec.right(1, seq($._ty_expr, "->", $._ty_expr)),
    ty_expr_app: $ => prec.left(9, seq($._ty_expr, $._ty_expr)),
    _ty_expr_simple: $ => choice(
      seq("(", $._ty_expr, ")"),
      $.ty_expr_wildcard,
      $.uid_path,
      // $.ty_kind_annot,
      $.ty_effect,
      $.ty_record,
    ),

    ex_handler: $ => seq("handler", $._expr, repeat($._h_clause), "end"),

    ty_effect: $ => seq(
      "[",
      optional(seq($._ty_expr, repeat(seq(",", $._ty_expr)))),
      optional($.ty_effect_row),
      "]"
    ),

    ty_effect_row: $ => seq("|", $._ty_expr_simple),

    ty_expr_wildcard: _ => "_",
    wildcard: _ => "_",

    ty_record: $ => seq("{", $._ty_field, repeat(seq(",", $._ty_field)), "}"),

    _ty_field: $ => choice(
      $.ty_fld_anontype,
      $.ty_fld_effect,
      $.ty_fld_effectval,
      $.ty_fld_type,
      $.ty_fld_typeval,
      $.ty_fld_name,
      $.ty_fld_nameval,
    ),

    ty_fld_anontype: $ => seq("type", $._ty_expr),
    ty_fld_effect: $ => "effect",
    ty_fld_effectval: $ => seq("effect", "=", $._ty_expr),
    // ty_fld_type: $ => choice($.uid, /* TODO: kind expressions */),
    ty_fld_type: $ => $.uid,
    ty_fld_typeval: $ => seq($.uid, "=", $._ty_expr),
    ty_fld_name: $ => $._name,
    ty_fld_nameval: $ => seq($._name, ":", $._ty_expr),



    _expr: $ => choice(
      $.ex_def_list,
      $.ex_fn,
      $.ex_effect,
      $.ex_binop,
      $.ex_unop,
      $.ex_annot,
      $.ex_app,
      $._ex_simple,
      $.ex_if,
      $.ex_if_no_else,
      $.ex_extern,
      // TODO: others
    ),

    ex_if: $ => prec(2,seq("if", $._expr, "then", $._expr, "else", $._expr)),
    ex_if_no_else: $ => seq("if", $._expr, "then", $._expr),
    ex_pub: $ => seq( "pub", $._expr), 
    ex_extern: $ => seq("extern", $.lid),

    _ex_simple: $ => choice(
      $.lid,
      $.tlid,
      $.wildcard,
      $._ex_ctor,
      $.num,
      $.num64,
      $.str,
      $.chr,
      $.ctor_nil,
      $.ctor_unit,
      seq("(", $._expr, ")"),
      $.ex_list,
      $.ex_match,
      $.ex_record,
      $.ex_handler,
      seq("(", $.op, ")"),
      seq("(", $.op, ".)"),
      // TODO not ready for that can of worms
      // $.ex_pub, 

    ),

    ex_list: $ => seq("[", $._expr, repeat(seq(",", $._expr)), optional(","), "]"),

    _ex_ctor: $ => $.uid,

    ex_binop: $ => prec.left(1, seq($._expr, $.op, $._expr)),
    ex_unop: $ => prec(9, seq($.op, $._expr)),
    ex_fn: $ => prec.right(1, seq("fn", repeat1($._expr), "=>", prec.left(1, $._expr))),
    ex_annot: $ => prec(3, seq($._expr, $.type_annot)),

    ex_app: $ => prec.right(9, seq($._ex_simple, repeat1($._ex_simple))),

    resumption: $ => seq("/", $._expr),
    ex_effect: $ => prec.right(2 ,seq("effect", repeat($._expr), optional($.resumption), "=>", $._expr)),
    ex_def_list: $ => prec.right(1, seq($.def_list, "in", $._expr)),

    ex_match: $ => seq(
      "match", 
      $._expr, 
      "with", 
      optional(seq(
        optional("|"), 
        $.match_clause, 
        repeat(seq("|", $.match_clause)))
      ), 
      "end"
    ),

    match_clause: $ => seq($._expr, "=>", $._expr),

    ex_record: $ => seq("{", $._field, repeat(seq(",", $._field)), "}"),

    _field: $ => choice(
      $.fld_anontype,
      $.fld_effect,
      $.fld_effectval,
      $.fld_type,
      $.fld_typeval,
      $.fld_name,
      $.fld_nameval,
      $.fld_nameannot,
      $.fld_module,
    ),
    fld_anontype: $ => seq("type", $._ty_expr),
    fld_effect: $ => "effect",
    fld_effectval: $ => seq("effect", "=", $._ty_expr),
    // fld_type: $ => choice($.uid, /* TODO: kind expressions */),
    fld_type: $ => $.uid,
    fld_typeval: $ => seq($.uid, "=", $._ty_expr),
    fld_name: $ => $._name,
    fld_nameval: $ => seq($._name, "=", $._expr),
    fld_nameannot: $ => seq($._name, ":", $._ty_expr),
    fld_module: $ => seq("module", $.uid),
  }
});
