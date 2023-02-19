import { minimalSetup } from "codemirror";
import { Editor } from "./editor";
import * as clses from "./generated/classes";
import { Observable } from "rxjs";
import { DelayedInitObservable } from "./delayed_init_obs";
import { VizEvent } from "./exec_result";
import { dark_green, light_green } from "./containers/edit_page";
import { eventHappened } from "./eventHappened";
import { fixedHeightEditor } from "./editor_theme";

export class TabContent extends clses.TS_bottom_right_cell_contents_Container {
  private vizOutputEditor: Editor;
  private algoOutputEditor: Editor;

  private event$: DelayedInitObservable<VizEvent | null> = new DelayedInitObservable();

  public constructor(els: clses.TS_bottom_right_cell_contents_ContainerElements) {
    super(els);

    this.els.algo_output_tab.textContent = "Algorithm Output";
    this.els.viz_output_tab.textContent = "Viz Output";
    this.makeAlgoOutputVisible();

    this.vizOutputEditor = new Editor(this.els.viz_output, "", [minimalSetup, fixedHeightEditor]);

    this.vizOutputEditor.setReadOnly(true);

    this.algoOutputEditor = new Editor(this.els.algo_output, "", [minimalSetup, fixedHeightEditor]);

    this.algoOutputEditor.setReadOnly(true);

    eventHappened(this.els.algo_output_tab, "click").subscribe(this.makeAlgoOutputVisible.bind(this));
    eventHappened(this.els.viz_output_tab, "click").subscribe(this.makeVizOutputVisible.bind(this));

    this.event$.obs$().subscribe(this.handleEvent.bind(this));
  }

  private makeAlgoOutputVisible() {
    this.els.viz_output.hidden = true;
    this.els.viz_output_tab.style.backgroundColor = dark_green;
    this.els.algo_output.hidden = false;
    this.els.algo_output_tab.style.backgroundColor = light_green;
  }

  private makeVizOutputVisible() {
    this.els.viz_output.hidden = false;
    this.els.viz_output_tab.style.backgroundColor = light_green;
    this.els.algo_output.hidden = true;
    this.els.algo_output_tab.style.backgroundColor = dark_green;
  }

  private handleEvent(event: VizEvent | null) {
    if (event === null) {
      this.vizOutputEditor.setText("");
      this.algoOutputEditor.setText("");
    } else {
      if (event.viz_error !== null) {
        this.vizOutputEditor.setText(event.viz_error.error_msg);
      } else {
        this.vizOutputEditor.setText("");
      }
      this.algoOutputEditor.setText(event.algo_log);
    }
  }

  public addEvent$(event$: Observable<VizEvent | null>) {
    this.event$.init(event$);
  }
}
