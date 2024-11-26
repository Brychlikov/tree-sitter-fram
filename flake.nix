{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    systems.url = "github:nix-systems/default";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      systems,
    }:
    flake-utils.lib.eachSystem (import systems) (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages = flake-utils.lib.flattenTree { inherit (pkgs) hello; };

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            (tree-sitter.override {webUISupport = true;})
            nodejs_20 graphviz
          ];
          shellHook = ''
            alias ts=tree-sitter
          '';
        };
      }
    );
}
