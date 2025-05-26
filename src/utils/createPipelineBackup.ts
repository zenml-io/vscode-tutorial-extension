import { cp } from "node:fs/promises";
import * as vscode from "vscode";

export default async function createPipelineBackup(tutorialsUri: vscode.Uri) {
  const tutorialsPath = tutorialsUri.fsPath;
  try {
    await cp(`${tutorialsPath}/pipelines`, `${tutorialsPath}/pipelinesBackup`, {
      recursive: true,
      force: false,
    });
  } catch (error) {
    console.error("Failed to create backup:", error);
  }
}
