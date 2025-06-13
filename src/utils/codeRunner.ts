import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import * as vscode from "vscode";
import getNonce from "./getNonce";

export default function codeRunner(
  terminal: vscode.Terminal,
  fileUri: vscode.Uri,
  onSuccessCallback?: Function,
  onErrorCallback?: Function
) {
  const uniqueId = getNonce();

  const { successFilePath, errorFilePath } = initializeFileWatcher(
    fileUri.fsPath,
    uniqueId,
    onSuccessCallback,
    onErrorCallback
  );

  runCode(terminal, fileUri.fsPath, uniqueId, successFilePath, errorFilePath);
}

function runCode(
  terminal: vscode.Terminal,
  filePath: string,
  uniqueId: string,
  successFilePath: string,
  errorFilePath: string
) {
  const scriptPath = path.join(os.tmpdir(), `runCode${uniqueId}.sh`);

  // Get the project root directory (go up from pipeline file to project root)
  const projectRoot = path.resolve(path.dirname(filePath), "../..");

  const dashboardUrlFile = path.join(os.tmpdir(), `dashboard_url_${uniqueId}.txt`);
  
  writeFileSync(
    scriptPath,
    `
    {
    clear
    echo "Executing code..."
    cd "${projectRoot}"
    export PYTHONPATH="${projectRoot}:$PYTHONPATH"
    # Capture output to extract dashboard URL
    python "${filePath}" 2>&1 | tee /tmp/pipeline_output_${uniqueId}.log
    RESULT=$?
    
    # Extract dashboard URL if present
    grep "DASHBOARD_URL:" /tmp/pipeline_output_${uniqueId}.log | tail -1 | cut -d':' -f2- > "${dashboardUrlFile}"
    
    # Clean up
    rm -f /tmp/pipeline_output_${uniqueId}.log
    
    if [ $RESULT -eq 0 ]; then
      touch "${successFilePath}"
    else
      touch "${errorFilePath}"
    fi
    exit
    }
    `
  );

  terminal.sendText(`bash ${scriptPath}`);
}

function initializeFileWatcher(
  filePath: string,
  uniqueId: string,
  onSuccessCallback?: Function,
  onFailureCallback?: Function
) {
  const removeLastFileFromPath = (filePath: string) => {
    let sections = filePath.split("/");
    sections.pop();
    return sections.join("/") + "/";
  };

  const successFileName = `runSuccess${uniqueId}.txt`;
  const errorFileName = `runError${uniqueId}.txt`;
  const scriptPath = path.join(os.tmpdir(), `runCode${uniqueId}.sh`);

  const pathWithoutEndFile = removeLastFileFromPath(filePath);
  const successFilePath = `${pathWithoutEndFile}${successFileName}`;
  const errorFilePath = `${pathWithoutEndFile}${errorFileName}`;

  // File System watcher for signal files
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(pathWithoutEndFile, "*.txt")
  );

  // Logic to run once a signal file is created
  watcher.onDidCreate((uri) => {
    if (uri.fsPath.endsWith(successFileName)) {
      vscode.workspace.fs.delete(uri);
      unlinkSync(scriptPath);
      watcher.dispose();
      
      // Try to read dashboard URL if available
      const dashboardUrlFile = path.join(os.tmpdir(), `dashboard_url_${uniqueId}.txt`);
      let dashboardUrl: string | undefined;
      try {
        if (existsSync(dashboardUrlFile)) {
          dashboardUrl = readFileSync(dashboardUrlFile, 'utf8').trim();
          unlinkSync(dashboardUrlFile);
        }
      } catch (error) {
        // Ignore errors reading dashboard URL
      }
      
      if (onSuccessCallback) {
        onSuccessCallback(dashboardUrl);
      }
    } else if (uri.fsPath.endsWith(errorFileName)) {
      vscode.workspace.fs.delete(uri);
      unlinkSync(scriptPath);
      watcher.dispose();

      if (onFailureCallback) {
        onFailureCallback();
      }
    }
  });

  // Return paths for both success and error signal files for external use
  return { successFilePath, errorFilePath };
}
