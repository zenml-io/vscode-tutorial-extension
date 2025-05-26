import * as vscode from "vscode";
import { TutorialSection } from "./tutorialSection";
import { TutorialData } from "./tutorialSection";

export default class Tutorial {
  public currentSection: TutorialSection;
  public sections: TutorialSection[];
  public latestSectionIndex: number;
  private _context: vscode.ExtensionContext;

  constructor(metadata: TutorialData, context: vscode.ExtensionContext) {
    this.sections = metadata.sections.map((section, index) => {
      return new TutorialSection(section, context, index);
    });

    this._context = context;
    this.latestSectionIndex = 0;
    this.currentSection = this.sections[0];
  }

  setCurrentSection(index: number) {
    if (index > -1 && index < this.sections.length) {
      if (index > this.latestSectionIndex) {
        this.latestSectionIndex = index;
      }
      
      this.currentSection = this.sections[index];
    } else {
      throw new Error("Invalid Index");
    }
  }

  back() {
    if (this.currentSection.currentStep === 0 && this.currentSection.index !== 0) {
      this.setCurrentSection(this.currentSection.index - 1);
    } else {
      this.currentSection.previousStep();
    } 
  }
}
