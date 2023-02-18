import { python } from "@codemirror/lang-python";
import { basicSetup } from "codemirror";
import { Editor } from "./editor";
import * as clses from "./generated/classes";
import { fixedHeightEditor } from "./editor_theme";
import { Observable } from "rxjs";
import { DelayedInitObservable } from "./delayed_init_obs";
import { VizEvent } from "./exec_result";


export class AlgoEditor extends clses.TS_algo_editor_wrapper_Container {
  private algoEditor: Editor;
  private event$: DelayedInitObservable<VizEvent | null> = new DelayedInitObservable();

  public constructor(els: clses.TS_algo_editor_wrapper_ContainerElements) {
    super(els);

    this.algoEditor = new Editor(this.els.algo_editor, `
for x in range(50, 500, 50):
    for y in range(50, 500, 50):
        n = y / 50
          `, [basicSetup, fixedHeightEditor, python()]);

    this.event$.obs$().subscribe(this.handleEvent.bind(this));
  }

  private handleEvent(event: VizEvent | null){
    if (event === null) {
      this.algoEditor.setHighlightLine(-1);
    } else {
      console.log(event.lineno);
      this.algoEditor.setHighlightLine(event.lineno);
    }
  }

  public getValue(): string {
    return this.algoEditor.currentValue();
  }

  public addEvent$(curr_event: Observable<VizEvent | null>){
    this.event$.init(curr_event);
  }
}
