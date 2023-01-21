import * as styles from "./edit_page.css";
import { python } from "@codemirror/lang-python";
import { basicSetup, EditorView } from "codemirror";
import { Editor } from "./editor";
// import { build_top, TS_app_Container, TS_bottom_left_cell_contents_Container, TS_ide_Container, TS_inputs_Container, TS_top_left_cell_contents_Container } from "./generated/classes";
import { build_app } from "./generated/classes";
import * as clses from "./generated/classes";
import { fromEvent, map, Observable } from "rxjs";
import { pyodide_ready } from "./py-worker";

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
  public constructor(protected readonly el: HTMLDivElement, protected readonly left_col: HTMLDivElement, protected readonly right_edge: HTMLDivElement, protected readonly top_left_cell: HTMLDivElement, protected readonly left_bottom_edge: HTMLDivElement, protected readonly top_left_cell_contents: HTMLDivElement, protected readonly algo_editor_wrapper: clses.TS_algo_editor_wrapper_Container, protected readonly inputs: Inputs, protected readonly bottom_left_cell: HTMLDivElement, protected readonly left_top_edge: HTMLDivElement, protected readonly bottom_left_cell_contents: clses.TS_bottom_left_cell_contents_Container, protected readonly right_col: HTMLDivElement, protected readonly left_edge: HTMLDivElement, protected readonly top_right_cell: HTMLDivElement, protected readonly right_bottom_edge: HTMLDivElement, protected readonly top_right_cell_contents: clses.TS_top_right_cell_contents_Container, protected readonly bottom_right_cell: HTMLDivElement, protected readonly right_top_edge: HTMLDivElement, protected readonly bottom_right_cell_contents: clses.TS_bottom_right_cell_contents_Container) {
    // super(el, left_col, right_edge, top_left_cell, left_bottom_edge, top_left_cell_contents,
    //   bottom_left_cell, left_top_edge, bottom_left_cell_contents, right_col,
    //    left_edge, top_right_cell, right_bottom_edge, top_right_cell_contents, bottom_right_cell, right_top_edge, bottom_right_cell_contents);
    super(el, left_col, right_edge, top_left_cell, left_bottom_edge, top_left_cell_contents, algo_editor_wrapper,inputs,bottom_left_cell,left_top_edge,bottom_left_cell_contents,right_col,left_edge,top_right_cell,right_bottom_edge,top_right_cell_contents,bottom_right_cell,right_top_edge,bottom_right_cell_contents);

    this.el.classList.add(styles.ide_style);

    const resize_cols_listener = create_resize_col_listener(el, "--col-1-width", "--col-2-width");
    this.right_edge.addEventListener("mousedown", resize_cols_listener);
    this.left_edge.addEventListener("mousedown", resize_cols_listener);

    const left_rows_md_listener = create_resize_row_listener(el, "--row-11-height", "--row-12-height");
    this.left_top_edge.addEventListener("mousedown", left_rows_md_listener);
    this.left_bottom_edge.addEventListener("mousedown", left_rows_md_listener);

    const right_rows_md_listener = create_resize_row_listener(el, "--row-21-height", "--row-22-height");
    this.right_top_edge.addEventListener("mousedown", right_rows_md_listener);
    this.right_bottom_edge.addEventListener("mousedown", right_rows_md_listener);

    this.inputs.addPyodideAvailable(pyodide_ready);
  }
}

class AlgoEditor extends clses.TS_algo_editor_wrapper_Container {
  //@ts-ignore
  private algoEditor: Editor;

  public constructor(protected readonly el: HTMLDivElement, protected readonly algo_editor: HTMLDivElement) {
    super(el, algo_editor);

    const fixedHeightEditor = EditorView.theme({
      "&": {height: "100%"},
      ".cm-scroller": {overflow: "auto"}
    });

    this.algoEditor = new Editor(this.algo_editor, `
    for x in range(50, 500, 50):
        for y in range(50, 500, 50):
            n = y / 50
          `, [basicSetup, fixedHeightEditor, python()]);
  }
}

class VizEditorArea extends clses.TS_bottom_left_cell_contents_Container {
  //@ts-ignore
  private vizEditor: Editor;

  public constructor(protected readonly el: HTMLDivElement, protected readonly viz_editor_wrapper: HTMLDivElement, protected readonly viz_editor: HTMLDivElement) {
    super(el, viz_editor_wrapper, viz_editor);

    const fixedHeightEditor = EditorView.theme({
      "&": {height: "100%"},
      ".cm-scroller": {overflow: "auto"}
    });

    this.vizEditor = new Editor(this.viz_editor, `
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
}

class VizOutput extends clses.TS_top_right_cell_contents_Container {
  public constructor(protected readonly el: HTMLDivElement){
    super(el);
    el.textContent = "viz goes here";
  }
}

function eventHappened(el: HTMLElement, event_name: string): Observable<null> {
  return fromEvent(el, event_name).pipe(map((_ev: Event) => { return null; }));
}

class Inputs extends clses.TS_inputs_Container {

  private _saveClicked: Observable<null>;
  private _runClicked: Observable<null>;
  private _prevClicked: Observable<null>;
  private _nextClicked: Observable<null>;
  private _playClicked: Observable<null>;

  public constructor(protected readonly el: HTMLDivElement, protected readonly speed: HTMLSelectElement, protected readonly very_fast: HTMLOptionElement, protected readonly fast: HTMLOptionElement, protected readonly medium: HTMLOptionElement, protected readonly slow: HTMLOptionElement, protected readonly very_slow: HTMLOptionElement, protected readonly save: HTMLButtonElement, protected readonly run: HTMLButtonElement, protected readonly play: HTMLButtonElement, protected readonly prev: HTMLButtonElement, protected readonly next: HTMLButtonElement) {
    super(el, speed, very_fast, fast, medium, slow, very_slow, save, run, play, prev, next);
    this.very_fast.textContent = "Very Fast";
    this.fast.textContent = "Fast";
    this.medium.textContent = "Medium";
    this.slow.textContent = "Slow";
    this.very_slow.textContent = "Very Slow";
    this.speed.selectedIndex = 2;

    this.save.textContent = "Save";
    this.run.textContent = "Run";
    this.prev.textContent = "Previous";
    this.next.textContent = "Next";
    this.play.textContent = "Play";

    this._saveClicked = eventHappened(this.save, "click");
    this._runClicked = eventHappened(this.run, "click");
    this._prevClicked = eventHappened(this.prev, "click");
    this._nextClicked = eventHappened(this.next, "click");
    this._playClicked = eventHappened(this.play, "click");

    for (const input of [this.speed,this.save,this.run,this.prev,this.next,this.play]){
      input.disabled = true;
    }
  }

  public addPyodideAvailable(pyodide_available: Observable<boolean>){
    pyodide_available.subscribe(avail => {
      this.run.disabled = !avail;
    });
  }

  public saveClicked(): Observable<null> {
    return this._saveClicked;
  }

  public runClicked(): Observable<null> {
    return this._runClicked;
  }

  public prevClicked(): Observable<null> {
    return this._prevClicked;
  }

  public nextClicked(): Observable<null> {
    return this._nextClicked;
  }

  public playClicked(): Observable<null> {
    return this._playClicked;
  }

}


function setup() {
  const top_el = document.getElementById("app");
  if (top_el === null || top_el.tagName.toLowerCase() != "div") {
    throw Error(`Unable to find div element with id "app": ${top_el}`);
  }
  top_el.textContent = "";

  const app = build_app({
    TS_inputs_Container_cls: Inputs,
    TS_algo_editor_wrapper_Container_cls: AlgoEditor,
    TS_bottom_left_cell_contents_Container_cls: VizEditorArea,
    TS_top_right_cell_contents_Container_cls: VizOutput,
    TS_bottom_right_cell_contents_Container_cls: clses.TS_bottom_right_cell_contents_Container,
    TS_ide_Container_cls: IDE,
    TS_content_Container_cls: clses.TS_content_Container,
    TS_app_Container_cls: clses.TS_app_Container,
  });

  app.replaceEl(top_el as HTMLDivElement);
}

setup();
