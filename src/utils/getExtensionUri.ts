import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

function getExtensionVersion(): string {
  try {
    const packageJsonPath = path.join(__dirname, "..", "..", "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    return packageJson.version;
  } catch (error) {
    console.warn("Could not read package.json version, using fallback", error);
    return "0.1.4"; // Fallback version
  }
}

export default function getExtensionUri(context: vscode.ExtensionContext) {
  if (context.extensionMode === vscode.ExtensionMode.Production) {
    // Check if ZENML_ENABLE_TUTORIAL is set to true (for codespace containers)
    const isTutorialEnabled = process.env.ZENML_ENABLE_TUTORIAL === "true";
    const isCodespace = process.env.CODESPACES === "true";
    const version = getExtensionVersion();

    if (isTutorialEnabled) {
      // Use the codespace container extension path when tutorial is enabled
      return vscode.Uri.file(
        `/home/coder/extensions/zenml-io.zenml-tutorial-${version}-universal`
      );
    } else {
      // Use the original logic for other environments
      return vscode.Uri.file(
        `/root/${
          isCodespace ? ".vscode-remote" : ".vscode-server"
        }/extensions/zenml-io.zenml-tutorial-${version}`
      );
    }
  } else {
    return vscode.Uri.file("/workspaces/vscode-tutorial-extension");
  }
}
