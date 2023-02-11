import { python } from "@codemirror/lang-python";
import { basicSetup } from "codemirror";
import { Editor } from "./editor";
import * as clses from "./generated/classes";
import { fixedHeightEditor } from "./editor_theme";


export class AlgoEditor extends clses.TS_algo_editor_wrapper_Container {
  private algoEditor: Editor;

  public constructor(els: clses.TS_algo_editor_wrapper_ContainerElements) {
    super(els);

    this.algoEditor = new Editor(this.els.algo_editor, `
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
          `, [basicSetup, fixedHeightEditor, python()]);
  }

  public getValue(): string {
    return this.algoEditor.currentValue();
  }
}
