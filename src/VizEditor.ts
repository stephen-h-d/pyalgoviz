import { python } from "@codemirror/lang-python";
import { basicSetup, EditorView } from "codemirror";
import { Observable } from "rxjs";
import { DelayedInitObservable } from "./delayed_init_obs";
import { Editor } from "./editor";
import { VizEvent } from "./exec_result";
import * as clses from "./generated/classes";

export class VizEditor extends clses.TS_viz_editor_wrapper_Container {
  private vizEditor: Editor;
  private event$: DelayedInitObservable<VizEvent | null> = new DelayedInitObservable();

  public constructor(els: clses.TS_viz_editor_wrapper_ContainerElements) {
    super(els);

    const fixedHeightEditor = EditorView.theme({
      "&": { height: "100%" },
      ".cm-scroller": { overflow: "auto" }
    });

    this.vizEditor = new Editor(this.els.viz_editor, `
from math import pi

text(x, y, "x=%s y=%s n=%d" % (x, y, n), size=10 + n*3, font="Arial", color='red')
rect(450, 50, 50 + n*10, 50 + n*10, fill="brown", border="lightyellow")
line(50, 50, x, y, color="purple", width=6)
circle(300, 200, n * 25, fill="transparent", border="green")
arc(100,
    325,
    innerRadius=50,
    outerRadius=100,
    startAngle=(n - 1) * 2 * pi/7,
    endAngle=n * 2 * pi/7,
    color="orange")
      `, [basicSetup, fixedHeightEditor, python()]);

    this.event$.obs$().subscribe(this.handleEvent.bind(this));
  }

  private handleEvent(event: VizEvent | null){
    if (event === null || event.viz_error === null) {
      this.vizEditor.setErrorLine(-1);
    } else {
      this.vizEditor.setErrorLine(event.viz_error.lineno);
    }
  }

  public getValue(): string {
    return this.vizEditor.currentValue();
  }

  public addEvent$(curr_event: Observable<VizEvent | null>){
    this.event$.init(curr_event);
  }
}
