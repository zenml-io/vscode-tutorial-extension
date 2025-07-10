// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import Tutorial from "./tutorial";
import tutorialMetadata from "./tutorialMetadata.json";
import TutorialOrchestrator from "./tutorialOrchestrator";
import createPipelineBackup from "./utils/createPipelineBackup";
import getExtensionUri from "./utils/getExtensionUri";
import setDirectory from "./utils/setExtensionDirectory";
import { ZenmlSidebarProvider } from "./zenmlSidebarProvider";

export async function activate(context: vscode.ExtensionContext) {
  console.log("ZenML Tutorial extension is being activated");
  
  try {
    const extensionUri = getExtensionUri(context);
    console.log("Extension URI:", extensionUri.toString());
    
    // Only set the directory if running in devcontainer
    if (vscode.env.remoteName) {
      setDirectory(extensionUri);
      console.log("Set directory for remote environment");
    }

    createPipelineBackup(extensionUri);
    console.log("Created pipeline backup");

    const tutorial = new Tutorial(tutorialMetadata, context);
    const orchestrator = new TutorialOrchestrator(context, tutorial);
    console.log("Created tutorial and orchestrator instances");

    // Register sidebar provider
    const sidebarProvider = new ZenmlSidebarProvider(orchestrator);
    const treeView = vscode.window.createTreeView('zenmlTutorialView', {
      treeDataProvider: sidebarProvider
    });
    context.subscriptions.push(treeView);
    console.log("Registered sidebar provider");

    // Register command to start tutorial
    const startCommand = vscode.commands.registerCommand("zenml.startTutorial", () => {
      console.log("zenml.startTutorial command triggered");
      vscode.window.showInformationMessage("Starting ZenML Tutorial...");
      orchestrator.start();
    });

    // Register command to open homepage (welcome screen)
    const homepageCommand = vscode.commands.registerCommand("zenml.openHomepage", () => {
      console.log("zenml.openHomepage command triggered");
      vscode.window.showInformationMessage("Opening ZenML Homepage...");
      orchestrator.openSection(0); // Open welcome screen
    });

    context.subscriptions.push(startCommand, homepageCommand);
    console.log("Registered commands:", ["zenml.startTutorial", "zenml.openHomepage"]);

    // Check if this is the first time the extension is being activated
    const isFirstTime = !context.globalState.get<boolean>("zenml.hasBeenActivated", false);
    const isCodespace = process.env.CODESPACES === "true";
    const isTutorialEnabled = process.env.ZENML_ENABLE_TUTORIAL === "true";

    console.log("Environment check:", {
      isFirstTime,
      isCodespace,
      isTutorialEnabled
    });

    // Auto-start the tutorial only on first installation or in codespaces
    if (isFirstTime || isCodespace || isTutorialEnabled) {
      console.log("Auto-starting tutorial");
      orchestrator.start();
      
      // Mark as activated for future sessions
      if (isFirstTime) {
        await context.globalState.update("zenml.hasBeenActivated", true);
        console.log("Marked extension as activated");
      }
    } else {
      console.log("Not auto-starting tutorial");
    }
    console.log("ZenML Tutorial extension activation completed successfully");
  } catch (error) {
    console.error("ZenML Tutorial activation error:", error);
    vscode.window.showErrorMessage(`Failed to activate ZenML Tutorial: ${error}`);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
