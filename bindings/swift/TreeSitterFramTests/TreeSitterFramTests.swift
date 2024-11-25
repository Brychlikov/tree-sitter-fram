import XCTest
import SwiftTreeSitter
import TreeSitterFram

final class TreeSitterFramTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_fram())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Fram grammar")
    }
}
