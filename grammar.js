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

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => optional($.def_list),
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
    num: _ => /(0[bB][01]*|0[oO][0-7]*|[0-9]*|0[xX][0-9a-fA-F]*)/,
    num64: _ => /(0[bB][01]*|0[oO][0-7]*|[0-9]*|0[xX][0-9a-fA-F]*)L/,
    // TODO: escapes
    str: _ => /".*"/,
    chr: _ => /'.'/,

    def_list: $ => repeat1($._def),
    _def: $ => prec.left(11, choice( 
      $.def_let,
      $.def_data,
      // $.def_data_record,
      // $.def_label,
      $.def_handle,
      $.def_implicit,
      // TODO: others
    )),

    def_let: $ => prec.left(11, seq(optional("pub"), "let", optional("rec"), $._expr,  "=", $._expr)),

    def_data: $ => seq("data", optional("rec"), $._ty_expr, "=", optional("|"), optional($._ctor_decls1)),

    def_handle: $ => seq(optional("pub"), "handle", optional("rec"), $._expr, "=", $._expr, repeat($._h_clause)),

    def_implicit: $ => seq("implicit", $.tlid, optional($.implicit_ty_args), optional($.type_annot)),
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
    ),

    uid_path: $ => seq($.uid, repeat(seq(".", $.uid))),

    ty_expr_arr: $ => prec.right(1, seq($._ty_expr, "->", $._ty_expr)),
    ty_expr_app: $ => prec.left(9, seq($._ty_expr, $._ty_expr)),
    _ty_expr_simple: $ => choice(
      seq("(", $._ty_expr, ")"),
      $.ty_expr_wildcard,
      $.uid_path,
      // $.ty_kind_annot,
      $.ty_effect,
      // $.ty_record,
    ),

    ty_effect: $ => seq(
      "[",
      optional(seq($._ty_expr, repeat(seq(",", $._ty_expr)))),
      optional($.ty_effect_row),
      "]"
    ),

    ty_effect_row: $ => seq("|", $._ty_expr_simple),

    ty_expr_wildcard: _ => "_",
    wildcard: _ => "_",



    _expr: $ => choice(
      $.ex_def_list,
      $.ex_fn,
      $.ex_effect,
      $.ex_binop,
      $.ex_annot,
      $.ex_app,
      $._ex_simple,
      // TODO: others
    ),

    _ex_simple: $ => choice(
      $.lid,
      $.tlid,
      $.wildcard,
      $._ex_ctor,
      // $.num,
      // $.num64,
      // $.str,
      // $.chr,
      $.ctor_nil,
      $.ctor_unit,
      seq("(", $._expr, ")"),
      // $.ex_list,
      // $.ex_match,
      // $.ex_handler,
      // $.ex_record,
      // seq("(", $.op, ")"),
      // seq("(", $.op, ".)"),

    ),

    _ex_ctor: $ => $.uid,

    ex_binop: $ => prec.left(1, seq($._expr, $.op, $._expr)),
    ex_fn: $ => prec.right(1, seq("fn", repeat1($._expr), "=>", prec.left(1, $._expr))),
    ex_annot: $ => seq($._expr, $.type_annot),

    ex_app: $ => prec.right(9, seq($._ex_simple, repeat1($._ex_simple))),

    resumption: $ => seq("/", $._expr),
    ex_effect: $ => prec.right(1 ,seq("effect", repeat($._expr), optional($.resumption), "=>", $._expr)),
    ex_def_list: $ => prec.right(1, seq($.def_list, "in", $._expr)),




  }
});
