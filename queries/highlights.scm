;"abstr"    @keyword
"as"       @keyword
"data"     @keyword
"effect"   @keyword
;"effrow"   @keyword
;"else"     @keyword
"end"      @keyword
;"extern"   @keyword
"finally"  @keyword
"fn"       @keyword
"handle"   @keyword
;"handler"  @keyword
;"if"       @keyword
"implicit" @keyword
"import"   @keyword
"in"       @keyword
;"label"    @keyword
"let"      @keyword
"match"    @keyword
"method"   @keyword
"module"   @keyword
"of"       @keyword
;"open"     @keyword
"pub"      @keyword
"rec"      @keyword
"return"   @keyword
; "then"     @keyword
"type"     @keyword
"with"     @keyword
"_"        @keyword
(uid_path) @type

(block_comment) @comment

(num) @number

(def_let
  . (lid) @variable)
(def_let
  . (ex_app . (lid) @function))
