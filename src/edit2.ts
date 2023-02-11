import * as styles from "./edit_page.css";
import { python } from "@codemirror/lang-python";
import { basicSetup, EditorView, minimalSetup } from "codemirror";
import { Editor } from "./editor";
// import { build_top, TS_app_Container, TS_bottom_left_cell_contents_Container, TS_ide_Container, TS_inputs_Container, TS_top_left_cell_contents_Container } from "./generated/classes";
import { build_app } from "./generated/classes";
import * as clses from "./generated/classes";
import { BehaviorSubject, combineLatest, fromEvent, map, Observable, Subject } from "rxjs";
import { asyncRun, pyodide_ready } from "./py-worker";
import { DelayedInitObservable } from "./delayed_init_obs";
import {VizOutput} from "./animator";
import { VizEventNavigator, NavigationInputsClicked, VizEventIdx } from "./vizEvents";
import { executorScript } from "./executor";
import { ExecResult } from "./exec_result";


// Begin HMR Setup
// I am not 100% sure if this section is necessary to make HMR work,
// but it seems to ensure that it does.  The setup() function essentially
// recreates the entire page every time this module is reloaded.
// The only thing it doesn't do is reload
// pyodide.  That is what is handy about it for us, since we don't often
// need to reload pyodide, and it takes a while.
function reloadModule(newModule: any) {
  console.log("newModule: ", newModule, "reloading entire page");
}

if (import.meta.hot) {
  import.meta.hot.accept(reloadModule);
}
// End HMR Setup.

console.log(styles); // this is currently necessary to force vanilla extract to work


function create_resize_row_listener(el: HTMLDivElement, firstRowVar: string, secondRowVar: string){
  return (ev: MouseEvent) => {
    ev.preventDefault();
    const original_ide_rect = el.getBoundingClientRect();
    const total_height = original_ide_rect.height;
    const top_y = el.getBoundingClientRect().y;

    function mouse_moved(ev: MouseEvent) {
      const newFirstRowPct = Math.min(Math.max((ev.pageY - top_y) / total_height * 100,5),95);
      const newSecondRowPct = 100 - newFirstRowPct;
      el.style.setProperty(firstRowVar, `${newFirstRowPct}%`);
      el.style.setProperty(secondRowVar, `${newSecondRowPct}%`);
    }

    document.addEventListener("mousemove", mouse_moved); // TODO debounce this
    document.addEventListener("mouseup", (_ev: MouseEvent) => {
      document.removeEventListener("mousemove",mouse_moved);
    });
  };
}

function create_resize_col_listener(el: HTMLDivElement, firstColVar: string, secondColVar: string){
  return (ev: MouseEvent) => {
    ev.preventDefault();
    const original_ide_rect = el.getBoundingClientRect();
    const total_width = original_ide_rect.width;
    const left_x = el.getBoundingClientRect().x;

    function mouse_moved(ev: MouseEvent) {
      const newFirstColPct = Math.min(Math.max((ev.pageX - left_x) / total_width * 100,5),95);
      const newSecondColPct = 100 - newFirstColPct;
      el.style.setProperty(firstColVar, `${newFirstColPct}%`);
      el.style.setProperty(secondColVar, `${newSecondColPct}%`);
    }

    document.addEventListener("mousemove", mouse_moved); // TODO debounce this
    document.addEventListener("mouseup", (_ev: MouseEvent) => {
      document.removeEventListener("mousemove",mouse_moved);
    });
  };
}

class IDE extends clses.TS_ide_Container {
  private exec_result$ = new Subject<ExecResult>();
  private event_navigator: VizEventNavigator;
  private pyodide_running = new Subject<boolean>();

  public constructor(protected readonly els: clses.TS_ide_ContainerElements,
    protected readonly algo_editor_wrapper: AlgoEditor,
    protected readonly inputs: Inputs,
    protected readonly viz_editor_wrapper: VizEditor,
    protected readonly top_right_cell_contents: VizOutput,
    protected readonly bottom_right_cell_contents: clses.TS_bottom_right_cell_contents_Container,
    )
  {
    super(els,algo_editor_wrapper,inputs,viz_editor_wrapper,top_right_cell_contents,bottom_right_cell_contents);

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

    this.event_navigator = new VizEventNavigator(this.inputs.navigationInputs());
    this.event_navigator.addExecResult$(this.exec_result$);

    this.inputs.addEventIdx$(this.event_navigator.getVizEventIdx$());

    this.top_right_cell_contents.addCurrEvent(this.event_navigator.getEvent$());
  }

  private async run(){
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
    this.exec_result$.next(run_result);
  }
}

const fixedHeightEditor = EditorView.theme({
  "&": {height: "100%"},
  ".cm-scroller": {overflow: "auto"}
});

class AlgoEditor extends clses.TS_algo_editor_wrapper_Container {
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

class VizEditor extends clses.TS_viz_editor_wrapper_Container {
  private vizEditor: Editor;

  public constructor(els: clses.TS_viz_editor_wrapper_ContainerElements) {
    super(els);

    const fixedHeightEditor = EditorView.theme({
      "&": {height: "100%"},
      ".cm-scroller": {overflow: "auto"}
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
  }

  public getValue(): string {
    return this.vizEditor.currentValue();
  }
}

function eventHappened(el: HTMLElement, event_name: string): Observable<null> {
  return fromEvent(el, event_name).pipe(map((_ev: Event) => { return null; }));
}

class Inputs extends clses.TS_inputs_Container {

  private saveClicked$: Observable<null>;
  private runClicked$: Observable<null>;
  private prevClicked$: Observable<null>;
  private nextClicked$: Observable<null>;
  private speed$ = new BehaviorSubject("Medium");
  private playPauseClicked$: Observable<null>;

  private pyodide_running$: DelayedInitObservable<boolean> = new DelayedInitObservable(
    () => new BehaviorSubject(false)
  );

  private event_idx$: DelayedInitObservable<VizEventIdx> = new DelayedInitObservable();

  public constructor(els: clses.TS_inputs_ContainerElements) {
    super(els);
    this.els.very_fast.textContent = "Very Fast";
    this.els.fast.textContent = "Fast";
    this.els.medium.textContent = "Medium";
    this.els.slow.textContent = "Slow";
    this.els.very_slow.textContent = "Very Slow";
    this.els.speed.selectedIndex = 2;

    this.els.save.textContent = "Save";
    this.els.run.textContent = "Run";
    this.els.prev.textContent = "Previous";
    this.els.next.textContent = "Next";
    this.els.play.textContent = "Play";

    this.saveClicked$ = eventHappened(this.els.save, "click");
    this.runClicked$ = eventHappened(this.els.run, "click");
    this.prevClicked$ = eventHappened(this.els.prev, "click");
    this.nextClicked$ = eventHappened(this.els.next, "click");
    this.playPauseClicked$ = eventHappened(this.els.play, "click");
    this.els.speed.addEventListener("change", (_event) => this.speed$.next(this.els.speed.value));

    for (const input of [this.els.save,this.els.prev,this.els.next,this.els.play]){
      input.disabled = true;
    }
    this.els.play.disabled = false; // TODO make this something better

    this.event_idx$.obs$().subscribe(this.nextEventIdx.bind(this));

    this.els.run.disabled = !pyodide_ready.getValue(); // TODO improve this.  This is a fix for HMR
    combineLatest([pyodide_ready, this.pyodide_running$.obs$()]).subscribe(this._pyodide_update.bind(this));
  }

  private nextEventIdx(event_idx: VizEventIdx){
    this.els.prev.disabled = !event_idx.canGoPrev();
    this.els.next.disabled = !event_idx.canGoNext();
  }

  public addEventIdx$(event_idx$: Observable<VizEventIdx>) {
    this.event_idx$.init(event_idx$);
  }

  private _pyodide_update(pyodide_update: [boolean, boolean]) {
    const [avail, running] = pyodide_update;
    console.log(`avail ${avail} running ${running}`);
    this.els.run.disabled = !avail || running;
  }

  public addPyodideRunning(pyodide_running: Observable<boolean>){
    this.pyodide_running$.init(pyodide_running);
  }

  public saveClicked(): Observable<null> {
    return this.saveClicked$;
  }

  public runClicked(): Observable<null> {
    return this.runClicked$;
  }

  public prevClicked(): Observable<null> {
    return this.prevClicked$;
  }

  public nextClicked(): Observable<null> {
    return this.nextClicked$;
  }

  public playClicked(): Observable<null> {
    return this.playPauseClicked$;
  }

  public navigationInputs(): NavigationInputsClicked {
    return {
      prev$: this.prevClicked$,
      next$: this.nextClicked$,
      play_pause$: this.playPauseClicked$,
      speed$: this.speed$,
    };
  }
}

class TabContent extends clses.TS_bottom_right_cell_contents_Container{
  // @ts-ignore
  private vizOutputEditor: Editor;

  public constructor(els: clses.TS_bottom_right_cell_contents_ContainerElements, ){
    super(els);

    this.els.tab_1.textContent = "Algorithm Output";
    this.els.tab_2.textContent = "Viz Output";

    this.vizOutputEditor= new Editor(this.els.viz_output, `line one
line two
line three
you get the picture
lorem ipsum
etc. so forth

these are the things that we decide to do sometimes
              `, [minimalSetup, fixedHeightEditor]);
  }
}

function setup() {
  const ready = pyodide_ready.getValue();
  console.log(`pyodide_ready ${ready}`);

  const top_el = document.getElementById("app");
  if (top_el === null || top_el.tagName.toLowerCase() != "div") {
    throw Error(`Unable to find div element with id "app": ${top_el}`);
  }
  top_el.textContent = "";

  const app = build_app({
    TS_inputs_Container_cls: Inputs,
    TS_algo_editor_wrapper_Container_cls: AlgoEditor,
    TS_viz_editor_wrapper_Container_cls: VizEditor,
    TS_top_right_cell_contents_Container_cls: VizOutput,
    TS_ide_Container_cls: IDE,
    TS_content_Container_cls: clses.TS_content_Container,
    TS_app_Container_cls: clses.TS_app_Container,
    TS_bottom_right_cell_contents_Container_cls: TabContent,
  });

  app.replaceEl(top_el as HTMLDivElement);

  // pyodide_ready.next(ready);
}

setup();
