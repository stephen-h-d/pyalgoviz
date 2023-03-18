import * as styles from "./edit_page.css";
import * as clses from "./generated/classes";
import { Subject } from "rxjs";
import { asyncRun } from "./py-worker";
import { VizOutput } from "./VizOutput";
import { VizEventNavigator } from "./vizEvents";
import { executorScript } from "./executor";
import { ExecResult } from "./exec_result";
import { TabContent } from "./TabContent";
import { Inputs } from "./Inputs";
import { VizEditor } from "./VizEditor";
import { create_resize_col_listener, create_resize_row_listener } from "./resize_listeners";
import { AlgoEditor } from "./AlgoEditor";

export class IDE extends clses.TS_ide_Container {
  private exec_result$ = new Subject<ExecResult>();
  private event_navigator: VizEventNavigator;
  private pyodide_running = new Subject<boolean>();

  public constructor(protected readonly els: clses.TS_ide_ContainerElements,
    protected readonly algo_editor_wrapper: AlgoEditor,
    protected readonly inputs: Inputs,
    protected readonly viz_editor_wrapper: VizEditor,
    protected readonly top_right_cell_contents: VizOutput,
    protected readonly bottom_right_cell_contents: TabContent
  ) {
    super(els, algo_editor_wrapper, inputs, viz_editor_wrapper, top_right_cell_contents, bottom_right_cell_contents);

    const el = this.els.ide;
    el.classList.add(styles.ide_style);

    const resize_cols_listener = create_resize_col_listener(el, "--col-1-width", "--col-2-width");
    this.els.right_edge.addEventListener("mousedown", resize_cols_listener);
    this.els.left_edge.addEventListener("mousedown", resize_cols_listener);

    const left_rows_md_listener = create_resize_row_listener(el, "--row-11-height", "--row-12-height");
    this.els.left_top_edge.addEventListener("mousedown", left_rows_md_listener);
    this.els.left_bottom_edge.addEventListener("mousedown", left_rows_md_listener);

    const right_rows_md_listener = create_resize_row_listener(el, "--row-21-height", "--row-22-height");
    this.els.right_top_edge.addEventListener("mousedown", right_rows_md_listener);
    this.els.right_bottom_edge.addEventListener("mousedown", right_rows_md_listener);

    this.inputs.addPyodideRunning(this.pyodide_running);
    this.inputs.runClicked().subscribe(this.run.bind(this));
    this.inputs.addExecResult$(this.exec_result$);

    this.event_navigator = new VizEventNavigator(this.inputs.navigationInputs());
    this.event_navigator.addExecResult$(this.exec_result$);

    this.inputs.addEventIdx$(this.event_navigator.getVizEventIdx$());
    this.inputs.addPlaying$(this.event_navigator.getPlaying$());

    this.top_right_cell_contents.addEvent$(this.event_navigator.getEvent$());
    this.bottom_right_cell_contents.addEvent$(this.event_navigator.getEvent$());
    this.algo_editor_wrapper.addEvent$(this.event_navigator.getEvent$());
    this.viz_editor_wrapper.addEvent$(this.event_navigator.getEvent$());
  }

  private async run() {
    const algo_script = this.algo_editor_wrapper.getValue();
    const viz_script = this.viz_editor_wrapper.getValue();

    const context = {
      script: algo_script,
      viz: viz_script,
      showVizErrors: true,
    };

    this.pyodide_running.next(true);
    const result_json = await asyncRun(executorScript, context);
    this.pyodide_running.next(false);
    const run_result = JSON.parse(result_json) as ExecResult;
    console.log(run_result);
    this.exec_result$.next(run_result);
  }
}
