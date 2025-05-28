import * as vscode from "vscode";

export default function getExtensionUri(context: vscode.ExtensionContext) {
  if (context.extensionMode === vscode.ExtensionMode.Production) {
    // Check if ZENML_ENABLE_TUTORIAL is set to true (for codespace containers)
    const isTutorialEnabled = process.env.ZENML_ENABLE_TUTORIAL === "true";
    const isCodespace = process.env.CODESPACES === "true";

    if (isTutorialEnabled) {
      // Use the codespace container extension path when tutorial is enabled
      return vscode.Uri.file(
        "/home/coder/extensions/zenml.zenml-codespace-tutorial-0.0.1"
      );
    } else {
      // Use the original logic for other environments
      return vscode.Uri.file(
        `/root/${
          isCodespace ? ".vscode-remote" : ".vscode-server"
        }/extensions/zenml.zenml-codespace-tutorial-0.0.1`
      );
    }
  } else {
    return vscode.Uri.file("/workspaces/vscode-tutorial-extension");
  }
}
