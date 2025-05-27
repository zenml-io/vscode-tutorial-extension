import { readFileSync } from "fs";
import path from "path";
import * as vscode from "vscode";
import Tutorial from "./tutorial";
import codeRunner from "./utils/codeRunner";
import {
  default as fileBackupPath,
  default as fileHasBackup,
} from "./utils/fileBackupPath";
import getNonce from "./utils/getNonce";

export default class TutorialOrchestrator {
  private _currentlyDisplayingDocument: vscode.TextDocument | undefined;
  private _context: vscode.ExtensionContext;
  private _webviewFlags = {
    alwaysShowNextButton: false,
    showEditTextButton: false,
    showResetCodeButton: false,
  };
  private _codePanel: vscode.TextEditor | undefined;
  private _webviewPanel: vscode.WebviewPanel | undefined;
  private _terminal: vscode.Terminal | undefined;
  private _tutorial: Tutorial;
  private _pipelineRunning: boolean = false;
  private _completedTutorials: Set<number> = new Set();

  private _getDashboardUrl(runId?: string): string {
    const baseUrl = vscode.workspace
      .getConfiguration("zenml")
      .get<string>("dashboardUrl", "http://localhost:8080");
    return runId ? `${baseUrl}/workspaces/default/runs/${runId}` : baseUrl;
  }

  constructor(context: vscode.ExtensionContext, tutorial: Tutorial) {
    this._tutorial = tutorial;
    this._context = context;

    if (this._context.extensionMode === vscode.ExtensionMode.Production) {
      this._webviewFlags.alwaysShowNextButton = false;
      this._webviewFlags.showEditTextButton = false;
    }
  }

  public start() {
    this._loadProgress();
    this._closeSidebar();
    this._initializeRestoreCodeButtonListeners();
    this._closeAllTerminals();
    this._initializeTutorialTerminalClosedListener();
    vscode.window
      .createTerminal({ hideFromUser: true })
      .sendText("zenml init && zenml stack set default");
    this.openSection(0);
  }

  // SETTERS AND GETTERS
  public set terminal(value: vscode.Terminal | undefined) {
    this._terminal = value;
  }

  public get terminal(): vscode.Terminal {
    if (this._terminal === undefined) {
      this._terminal = vscode.window.createTerminal("ZenML Terminal");
    }

    return this._terminal;
  }

  public get webviewPanel(): vscode.WebviewPanel {
    if (this._webviewPanel === undefined) {
      this._initializePanel();
    }

    return this._webviewPanel as vscode.WebviewPanel;
  }

  // TUTORIAL NAVIGATION
  async back() {
    this._tutorial.back();
    this.openSection(this._tutorial.currentSection.index);
  }

  async openSection(sectionId: number) {
    this._tutorial.setCurrentSection(sectionId);

    if (this._tutorial.currentSection.code()) {
      await vscode.commands.executeCommand("vscode.setEditorLayout", {
        orientation: 0,
        groups: [
          { groups: [{}], size: 0.5 },
          { groups: [{}], size: 0.5 },
        ],
      });

      this.openCodePanel(this._tutorial.currentSection.code() as string);
    } else {
      this.closeCurrentCodePanel();
      await vscode.commands.executeCommand("vscode.setEditorLayout", {
        orientation: 0,
        groups: [{ groups: [{}], size: 1 }],
      });
    }

    this.openWebviewPanel(
      this._tutorial.currentSection.title,
      this._tutorial.currentSection.docHTML()
    );
  }

  openNextStep() {
    this._tutorial.currentSection.nextStep();
    this.openSection(this._tutorial.currentSection.index);
  }

  // TERMINAL
  public closeTerminal() {
    this.terminal?.hide();
  }

  sendTerminalCommand(command: string) {
    this.terminal.show(true);
    this.terminal.sendText(command);
  }

  async runCode(callback?: Function) {
    try {
      if (!this._codePanel) {
        throw new Error("Editor is not defined");
      }

      const activeEditorIsCurrentEditor =
        this._codePanel === vscode.window.activeTextEditor;

      if (!activeEditorIsCurrentEditor) {
        await vscode.window.showTextDocument(this._codePanel.document, {
          preview: true,
          preserveFocus: false,
          viewColumn: vscode.ViewColumn.Two,
        });
      }

      codeRunner(
        this.terminal,
        this._codePanel.document.uri,
        () => {
          vscode.window.showInformationMessage("Code Ran Successfully! 🎉");
          if (callback) {
            callback();
          }
          this.openNextStep();
        },
        () => {
          vscode.window.showErrorMessage("Code Run Encountered an Error. ❌");
        }
      );

      this.terminal.show(true);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to execute file: ${error}`);
    }
  }

  async runPipeline() {
    if (this._pipelineRunning) {
      return;
    }

    try {
      this._pipelineRunning = true;
      this._sendWebviewMessage({
        type: "pipelineStatusUpdate",
        status: "initializing",
      });

      if (!this._codePanel) {
        throw new Error("No code panel available");
      }

      const activeEditorIsCurrentEditor =
        this._codePanel === vscode.window.activeTextEditor;

      if (!activeEditorIsCurrentEditor) {
        await vscode.window.showTextDocument(this._codePanel.document, {
          preview: true,
          preserveFocus: false,
          viewColumn: vscode.ViewColumn.Two,
        });
      }

      this._sendWebviewMessage({
        type: "pipelineStatusUpdate",
        status: "running",
      });

      // Execute the pipeline
      codeRunner(
        this.terminal,
        this._codePanel.document.uri,
        (runId?: string) => {
          // Pipeline completed successfully
          this._pipelineRunning = false;
          this._completedTutorials.add(this._tutorial.currentSection.index);
          this._sendWebviewMessage({
            type: "pipelineStatusUpdate",
            status: "completed",
          });
          this._sendWebviewMessage({ type: "pipelineCompleted", runId: runId });

          // Save progress
          this._saveProgress();

          // Show dashboard URL
          if (runId) {
            const dashboardUrl = this._getDashboardUrl(runId);
            this._sendWebviewMessage({
              type: "showDashboardUrl",
              url: dashboardUrl,
            });
          }
        },
        () => {
          // Pipeline failed
          this._pipelineRunning = false;
          this._sendWebviewMessage({
            type: "pipelineStatusUpdate",
            status: "failed",
          });
          this._sendWebviewMessage({
            type: "pipelineFailed",
            error: "Pipeline execution failed",
          });

          vscode.window.showErrorMessage("Pipeline execution failed. ❌");
        }
      );

      this.terminal.show(true);
    } catch (error) {
      this._pipelineRunning = false;
      this._sendWebviewMessage({
        type: "pipelineStatusUpdate",
        status: "failed",
      });
      this._sendWebviewMessage({ type: "pipelineFailed", error: error });
      vscode.window.showErrorMessage(`Failed to execute pipeline: ${error}`);
    }
  }

  private _sendWebviewMessage(message: any) {
    if (this._webviewPanel && this._webviewPanel.webview) {
      this._webviewPanel.webview.postMessage(message);
    }
  }

  private _saveProgress() {
    // Save completed tutorials to workspace state
    const completedArray = Array.from(this._completedTutorials);
    this._context.workspaceState.update(
      "zenml.completedTutorials",
      completedArray
    );
  }

  private _loadProgress() {
    // Load completed tutorials from workspace state
    const completed = this._context.workspaceState.get<number[]>(
      "zenml.completedTutorials",
      []
    );
    this._completedTutorials = new Set(completed);
  }

  private _generateTutorialNavigation(): string {
    const currentIndex = this._tutorial.currentSection.index;
    const totalSections = this._tutorial.sections.length;
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === totalSections - 1;

    return `
      <div class="tutorial-header">
       <div class="tutorial-nav">
          <button class="nav-button prev ${
            isFirst ? "disabled" : ""
          }" id="nav-previous" ${isFirst ? "disabled" : ""}>
            <i class="codicon codicon-chevron-left"></i>
          </button>
          <div class="tutorial-title">
            <h2>${this._tutorial.currentSection.title}</h2>
            <p class="tutorial-description">
              ${this._tutorial.currentSection.description}
            </p>
          </div>
          <button class="nav-button next ${
            isLast ? "disabled" : ""
          }" id="nav-next" ${isLast ? "disabled" : ""}>
            <i class="codicon codicon-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  }
  // PANELS

  openWebviewPanel(title: string, docContent: string) {
    if (!this._webviewPanel) {
      this._initializePanel();
    }

    // nullcheck to make typescript happy
    if (this._webviewPanel) {
      this._webviewPanel.title = title;
      this._webviewPanel.webview.html = this._generateHTML(docContent);
    }
  }

  async openCodePanel(codePath: string) {
    const onDiskPath = path.join(this._context.extensionPath, codePath);
    const filePath = vscode.Uri.file(onDiskPath);
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      this._currentlyDisplayingDocument = document;
      this._codePanel = await vscode.window.showTextDocument(
        document,
        vscode.ViewColumn.Two
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  closeCurrentCodePanel() {
    const currentEditor = this._codePanel?.document;
    if (currentEditor) {
      vscode.window
        .showTextDocument(currentEditor, {
          preview: true,
          preserveFocus: false,
        })
        .then(() => {
          return vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor"
          );
        });
    }
  }

  async openEditPanel(codePath: string) {
    const onDiskPath = path.join(this._context.extensionPath, codePath);
    const filePath = vscode.Uri.file(onDiskPath);
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      this._currentlyDisplayingDocument = document;
      await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open file: ${error}`);
    }
  }

  public async restoreCodeToBackup() {
    const activeCodePanelDocument = this._currentlyDisplayingDocument;
    if (!activeCodePanelDocument) {
      return;
    }

    await vscode.window.showTextDocument(activeCodePanelDocument, {
      preview: true,
      preserveFocus: false,
      viewColumn: vscode.ViewColumn.Two,
    });

    const activeEditor = vscode.window.activeTextEditor;

    // Guard against errors when file doesn't have backup or no activeEditor
    if (!fileHasBackup(activeCodePanelDocument.uri.fsPath) || !activeEditor) {
      return;
    }

    // Grab backup content path for current document to replace active document's content)
    const backupPath = activeCodePanelDocument.uri.fsPath.replace(
      "pipelines",
      "pipelinesBackup"
    );

    //get the text from the backup
    const originalCode = readFileSync(backupPath, { encoding: "utf-8" });

    // A range that covers the entire document
    const documentRange = new vscode.Range(
      0,
      0,
      activeCodePanelDocument.lineCount,
      Infinity
    );

    activeEditor.edit((editBuilder) => {
      editBuilder.replace(documentRange, originalCode);
    });

    activeEditor.document.save();
  }

  // INITIALIZERS
  private _initializePanel() {
    this._webviewPanel = vscode.window.createWebviewPanel(
      "zenml.markdown", // used internally - I think an identifier
      "Zenml", // displayed to user
      vscode.ViewColumn.One,
      {}
    );

    this._registerView();
    this._webviewPanel.onDidDispose(() => {
      this._webviewPanel = undefined;
    });
  }

  private _initializeRestoreCodeButtonListeners() {
    vscode.window.onDidChangeActiveTextEditor((event) => {
      if (event) {
        this._currentlyDisplayingDocument = event.document;
        this._checkCodeMatchAndUpdateWebview(event);
      }
    });

    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length !== 0) {
        this._checkCodeMatchAndUpdateWebview(event);
      }
    });
  }

  // Updates the status of tutorial terminal if ZenML terminal
  // instance gets disposed of
  private _initializeTutorialTerminalClosedListener() {
    this._context.subscriptions.push(
      vscode.window.onDidCloseTerminal((closedTerminal) => {
        if (closedTerminal === this.terminal) {
          this.terminal = undefined;
        }
      })
    );
  }

  private _closeAllTerminals() {
    // Only close terminals that belong to ZenML to avoid affecting user's existing terminals
    vscode.window.terminals.forEach((term) => {
      if (term.name === "ZenML Terminal" || term.name.includes("ZenML")) {
        term.dispose();
      }
    });
  }

  private _closeSidebar() {
    vscode.commands.executeCommand("workbench.view.explorer");
    vscode.commands.executeCommand("workbench.action.toggleSidebarVisibility");
  }

  // HELPERS
  private _isCodeSameAsBackup() {
    const activeCodePanel = vscode.window.activeTextEditor;
    if (!activeCodePanel) {
      return false;
    }

    const backupPath = fileBackupPath(activeCodePanel?.document.uri.fsPath);

    if (!backupPath) {
      return false;
    }

    const backupContents = readFileSync(backupPath, { encoding: "utf-8" });
    const workingFileContents = activeCodePanel.document.getText();

    return workingFileContents === backupContents;
  }

  private _checkCodeMatchAndUpdateWebview(
    event: vscode.TextDocumentChangeEvent | vscode.TextEditor
  ) {
    const filePath = event.document.uri.fsPath;
    // If backup exists, rerender Doc panel if necessary
    if (fileBackupPath(filePath)) {
      // Should show reset code button if current code does NOT match backup
      const shouldShowResetCodeButton = !this._isCodeSameAsBackup();

      // If code status changed, update flag and reopen Webview Panel:
      if (
        shouldShowResetCodeButton !== this._webviewFlags.showResetCodeButton
      ) {
        this._webviewFlags.showResetCodeButton = shouldShowResetCodeButton;
        this.openWebviewPanel(
          this._tutorial.currentSection.title,
          this._tutorial.currentSection.docHTML()
        );
      }
    }
  }

  // WEBVIEW
  private _registerView() {
    this.webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri],
    };

    this.webviewPanel.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "openSection": {
          this.openSection(data.id);
          this.closeTerminal();
          break;
        }
        case "runCodeFile": {
          await this.runCode();
          break;
        }
        case "runPipeline": {
          await this.runPipeline();
          break;
        }
        // Enhanced navigation cases
        case "navigatePrevious": {
          this.back();
          break;
        }
        case "navigateNext": {
          if (this._tutorial.currentSection.isDone()) {
            this.openSection(this._tutorial.currentSection.index + 1);
            this.closeTerminal();
          } else {
            this._tutorial.currentSection.nextStep();
            this.openSection(this._tutorial.currentSection.index);
          }
          break;
        }
        case "toggleBreadcrumb": {
          // This is handled client-side, but we can track analytics here
          break;
        }
        case "jumpToSection": {
          const sectionIndex = parseInt(data.sectionIndex);
          if (
            !isNaN(sectionIndex) &&
            sectionIndex >= 0 &&
            sectionIndex < this._tutorial.sections.length
          ) {
            this.openSection(sectionIndex);
            this.closeTerminal();
          }
          break;
        }
        // Keep existing cases
        case "editText": {
          this.openEditPanel(this._tutorial.currentSection.doc());
          break;
        }
        case "serverConnect": {
          this.sendTerminalCommand(`zenml connect --url "${data.url}"`);
          break;
        }
        case "localServerConnect": {
          this.sendTerminalCommand("zenml up");
          break;
        }
        case "nextStep": {
          this._tutorial.currentSection.nextStep();
          this.openSection(this._tutorial.currentSection.index);
          break;
        }
        case "next": {
          if (this._tutorial.currentSection.isDone()) {
            this.openSection(this._tutorial.currentSection.index + 1);
            this.closeTerminal();
          } else {
            this._tutorial.currentSection.nextStep();
            this.openSection(this._tutorial.currentSection.index);
          }
          break;
        }
        case "resetCodeFile": {
          this.restoreCodeToBackup();
          break;
        }
        case "previous": {
          this.back();
          break;
        }
        case "openDashboard": {
          vscode.env.openExternal(vscode.Uri.parse(data.url));
          break;
        }
      }
    });
  }

  // Update the _generateHTML method to include the enhanced navigation
  private _generateHTML(docContent: string) {
    const webview = this.webviewPanel.webview;

    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "media", "main.js")
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "media", "vscode.css")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "media", "main.css")
    );

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

    // Process images in doc content
    docContent = docContent.replace(
      /<img\s+[^>]*src="([^"]*)"[^>]*>/g,
      (match, originalSrc) => {
        const onDiskPath = vscode.Uri.joinPath(
          this._context.extensionUri,
          originalSrc
        );
        const newSrc = this._webviewPanel?.webview.asWebviewUri(onDiskPath);
        return match.replace(/src="[^"]*"/, `src="${newSrc}"`);
      }
    );

    const nonce = getNonce();

    // Generate enhanced navigation
    const tutorialNavigation = this._generateTutorialNavigation();

    return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${
      webview.cspSource
    }; style-src ${webview.cspSource}; font-src ${
      webview.cspSource
    }; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleVSCodeUri}" rel="stylesheet">
    <link href="${styleMainUri}" rel="stylesheet">
    <link href="${codiconsUri}" rel="stylesheet" />
    <title>ZenML Interactive Tutorial</title>
  </head>
  <body>
    <header>
      ${tutorialNavigation}
    </header>
    <main>
      ${docContent}
      <div>
        ${
          this._tutorial.currentSection.canRunPipeline
            ? '<button class="action-button primary run-pipeline-button" id="run-pipeline"><i class="codicon codicon-play"></i><span>Run Pipeline</span></button>'
            : ""
        }
      </div>
    </main>
    
    <script nonce="${nonce}" src="${scriptUri}"></script>
    <script nonce="${nonce}">
      // Enhanced navigation event handling
      document.addEventListener('DOMContentLoaded', function() {
        // Navigation button handlers
        const prevButton = document.getElementById('nav-previous');
        const nextButton = document.getElementById('nav-next');
        
        if (prevButton) {
          prevButton.addEventListener('click', function() {
            vscode.postMessage({ type: 'previous' });
          });
        }
        
        if (nextButton) {
          nextButton.addEventListener('click', function() {
            vscode.postMessage({ type: 'next' });
          });
        }
        
        // Action button handlers
        const runCodeButton = document.getElementById('runCodeFile');
        if (runCodeButton) {
          runCodeButton.addEventListener('click', function() {
            vscode.postMessage({ type: 'runCodeFile' });
          });
        }
        
        const runPipelineButton = document.getElementById('run-pipeline');
        if (runPipelineButton) {
          runPipelineButton.addEventListener('click', function() {
            vscode.postMessage({ type: 'runPipeline' });
          });
        }
        
        const editButton = document.getElementById('editText');
        if (editButton) {
          editButton.addEventListener('click', function() {
            vscode.postMessage({ type: 'editText' });
          });
        }
      });
    </script>
  </body>
  </html>`;
  }
}
