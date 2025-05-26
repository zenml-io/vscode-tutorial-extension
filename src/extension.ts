// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import Tutorial from "./tutorial";
import tutorialMetadata from "./tutorialMetadata.json";
import TutorialOrchestrator from "./tutorialOrchestrator";
import createPipelineBackup from "./utils/createPipelineBackup";
import getExtensionUri from "./utils/getExtensionUri";
import setDirectory from "./utils/setExtensionDirectory";

export async function activate(context: vscode.ExtensionContext) {
  try {
    const extensionUri = getExtensionUri(context);
    // Only set the directory if running in devcontainer
    if (vscode.env.remoteName) {
      setDirectory(extensionUri);
    }

    createPipelineBackup(extensionUri);

    const tutorial = new Tutorial(tutorialMetadata, context);
    const orchestrator = new TutorialOrchestrator(context, tutorial);

    // Register command to start tutorial
    const startCommand = vscode.commands.registerCommand("zenml.startTutorial", () => {
      orchestrator.start();
    });

    context.subscriptions.push(startCommand);

    // Auto-start the tutorial
    orchestrator.start();
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to activate ZenML Tutorial: ${error}`);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
