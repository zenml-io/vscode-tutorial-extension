import { cp } from "node:fs/promises";
import * as vscode from "vscode";

export default async function createPipelineBackup(extensionUri: vscode.Uri) {
  const extensionPath = extensionUri.fsPath;
  try {
    await cp(`${extensionPath}/pipelines`, `${extensionPath}/pipelinesBackup`, {
      recursive: true,
      force: false,
    });
  } catch (error) {
    console.error("Failed to create backup:", error);
  }
}
