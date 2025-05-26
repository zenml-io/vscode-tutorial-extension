import * as vscode from "vscode";

export default function getExtensionUri(context: vscode.ExtensionContext) {
  if (context.extensionMode === vscode.ExtensionMode.Production) {
    const isCodespace = process.env.CODESPACES === "true";

    return vscode.Uri.file(
      `/root/${
        isCodespace ? ".vscode-remote" : ".vscode-server"
      }/extensions/zenml.zenml-codespace-tutorial-0.0.1/pipelines`
    );
  } else {
    return vscode.Uri.file("/workspaces/vscode-tutorial-extension/pipelines");
  }
}
