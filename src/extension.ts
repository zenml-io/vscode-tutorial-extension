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
    try {
      const treeView = vscode.window.createTreeView('zenmlTutorialView', {
        treeDataProvider: sidebarProvider,
        showCollapseAll: false,
        canSelectMany: false
      });
      context.subscriptions.push(treeView);
      console.log("Registered sidebar provider successfully");
      
      // Force refresh to ensure the sidebar is populated
      sidebarProvider.refresh();
    } catch (error) {
      console.error("Failed to register sidebar provider:", error);
      vscode.window.showErrorMessage(`Failed to register sidebar: ${error}`);
    }

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

    // Check if auto-open tutorial is enabled
    const autoOpenTutorial = vscode.workspace
      .getConfiguration("zenml")
      .get<boolean>("autoOpenTutorial", true);
    
    console.log("Auto-open tutorial setting:", autoOpenTutorial);

    if (autoOpenTutorial) {
      console.log("Auto-opening ZenML tutorial homepage");
      
      // Show welcome message and open homepage
      vscode.window.showInformationMessage(
        "Welcome to ZenML! 🎉 Opening the tutorial homepage...",
        "Get Started",
        "Don't Show Again"
      ).then((selection) => {
        if (selection === "Get Started") {
          orchestrator.start();
        } else if (selection === "Don't Show Again") {
          // Disable auto-open for future sessions
          vscode.workspace.getConfiguration("zenml").update("autoOpenTutorial", false, true);
          vscode.window.showInformationMessage(
            "Auto-open disabled. You can re-enable it in Settings or use the sidebar button to open the tutorial."
          );
        }
      });
      
      // Auto-start homepage with slight delay to ensure everything is ready
      setTimeout(() => {
        orchestrator.start();
      }, 500);
    } else {
      console.log("Auto-open tutorial is disabled by user setting");
    }
    console.log("ZenML Tutorial extension activation completed successfully");
  } catch (error) {
    console.error("ZenML Tutorial activation error:", error);
    vscode.window.showErrorMessage(`Failed to activate ZenML Tutorial: ${error}`);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
