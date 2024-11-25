package tree_sitter_fram_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_fram "github.com/tree-sitter/tree-sitter-fram/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_fram.Language())
	if language == nil {
		t.Errorf("Error loading Fram grammar")
	}
}
