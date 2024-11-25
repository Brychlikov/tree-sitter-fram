// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterFram",
    products: [
        .library(name: "TreeSitterFram", targets: ["TreeSitterFram"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterFram",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterFramTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterFram",
            ],
            path: "bindings/swift/TreeSitterFramTests"
        )
    ],
    cLanguageStandard: .c11
)
