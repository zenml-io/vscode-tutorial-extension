import * as vscode from 'vscode';
import TutorialOrchestrator from './tutorialOrchestrator';

export class ZenmlSidebarProvider implements vscode.TreeDataProvider<SidebarItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<SidebarItem | undefined | null | void> = new vscode.EventEmitter<SidebarItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SidebarItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(private orchestrator: TutorialOrchestrator) {
  }

  private _createDefaultItems(): SidebarItem[] {
    return [
      new SidebarItem(
        'Welcome to ZenML Tutorial!',
        'Interactive tutorial introduction',
        vscode.TreeItemCollapsibleState.None,
        undefined,
        'info'
      ),
      new SidebarItem(
        'Open Homepage',
        'Open the tutorial homepage',
        vscode.TreeItemCollapsibleState.None,
        {
          command: 'zenml.openHomepage',
          title: 'Open Homepage',
          arguments: []
        },
        'home'
      )
    ];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SidebarItem): vscode.TreeItem {
    try {
      return element;
    } catch (error) {
      console.error('Error in getTreeItem:', error);
      // Return a minimal tree item in case of error
      return new vscode.TreeItem(element.label || 'Error', vscode.TreeItemCollapsibleState.None);
    }
  }

  getChildren(element?: SidebarItem): Thenable<SidebarItem[]> {
    try {
              if (!element) {
          const items = this._createDefaultItems();
          return Promise.resolve(items);
        }
      
      return Promise.resolve([]);
    } catch (error) {
      console.error('Error in getChildren:', error);
      // Return basic items even if there's an error
      return Promise.resolve(this._createDefaultItems());
    }
  }
}

class SidebarItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly tooltip: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly iconName?: string
  ) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.command = command;
    this.iconPath = new vscode.ThemeIcon(iconName || 'book');
  }
}