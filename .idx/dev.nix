# To learn more about how to use Nix to configure your environment
# see: https://firebase.google.com/docs/studio/customize-workspace
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_22
  ];

  # Sets environment variables in the workspace
  env = {};
  
  services = {
    docker = {
      enable = true;
    };
  };

  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "dbaeumer.vscode-eslint"
      "PKief.material-icon-theme"
      "ms-azuretools.vscode-docker"
      "ms-azuretools.vscode-containers"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        client = {
          cwd = "client";
          command = ["npm" "run" "dev"];
          manager = "web";
        };
        server = {
          cwd = "server";
          command = ["npm" "run" "dev"];
          manager = "web";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        install-client-deps = "cd client && npm ci";
        install-server-deps = "cd server && npm ci";
      };

      # Runs when the workspace is (re)started
      onStart = {};
    };
  };
}
