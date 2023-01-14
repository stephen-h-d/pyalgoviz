import * as styles from "./edit_page.css";
import { python } from "@codemirror/lang-python";
import { basicSetup, EditorView } from "codemirror";
import { Editor } from "./editor";
import { class_registry, TS_app_Container, TS_bottom_left_cell_contents_Container, TS_ide_Container, TS_inputs_Container, TS_top_left_cell_contents_Container } from "./generated/classes";
import { fromEvent, map, Observable } from "rxjs";

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

class IDE extends TS_ide_Container {
  public constructor(readonly el: HTMLDivElement) {
    super(el);

    this.el.classList.add(styles.ide_style);

    const resize_cols_listener = create_resize_col_listener(el, "--col-1-width", "--col-2-width");
    this.left_col.right_edge.el.addEventListener("mousedown", resize_cols_listener);
    this.right_col.left_edge.el.addEventListener("mousedown", resize_cols_listener);

    const left_rows_md_listener = create_resize_row_listener(el, "--row-11-height", "--row-12-height");
    this.left_col.bottom_left_cell.left_top_edge.el.addEventListener("mousedown", left_rows_md_listener);
    this.left_col.top_left_cell.left_bottom_edge.el.addEventListener("mousedown", left_rows_md_listener);

    const right_rows_md_listener = create_resize_row_listener(el, "--row-21-height", "--row-22-height");
    this.right_col.bottom_right_cell.right_top_edge.el.addEventListener("mousedown", right_rows_md_listener);
    this.right_col.top_right_cell.right_bottom_edge.el.addEventListener("mousedown", right_rows_md_listener);

    (this.left_col.top_left_cell.top_left_cell_contents as AlgoEditorArea).getInputs()
  }
}

class AlgoEditorArea extends TS_top_left_cell_contents_Container {
  //@ts-ignore
  private algoEditor: Editor;

  public constructor(readonly el: HTMLDivElement) {
    super(el);

    const fixedHeightEditor = EditorView.theme({
      "&": {height: "100%"},
      ".cm-scroller": {overflow: "auto"}
    });

    this.algoEditor = new Editor(this.algo_editor_wrapper.algo_editor.el, `
    for x in range(50, 500, 50):
        for y in range(50, 500, 50):
            n = y / 50
          `, [basicSetup, fixedHeightEditor, python()]);
  }

  public getInputs(): Inputs{
    // TODO figure out if there is a better way to do this. Also start using it
    return this.inputs as Inputs;
  }
}

class VizEditorArea extends TS_bottom_left_cell_contents_Container {
  //@ts-ignore
  private vizEditor: Editor;

  public constructor(readonly el: HTMLDivElement) {
    super(el);

    const fixedHeightEditor = EditorView.theme({
      "&": {height: "100%"},
      ".cm-scroller": {overflow: "auto"}
    });

    this.vizEditor = new Editor(this.viz_editor_wrapper.viz_editor.el, `
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

function eventHappened(el: HTMLElement, event_name: string): Observable<null> {
  return fromEvent(el, event_name).pipe(map((_ev: Event) => { return null; }));
}

class Inputs extends TS_inputs_Container {

  private _saveClicked: Observable<null>;
  private _runClicked: Observable<null>;
  private _prevClicked: Observable<null>;
  private _nextClicked: Observable<null>;
  private _playClicked: Observable<null>;

  public constructor(readonly el: HTMLDivElement) {
    super(el);
    this.speed.very_fast.el.textContent = "Very Fast";
    this.speed.fast.el.textContent = "Fast";
    this.speed.medium.el.textContent = "Medium";
    this.speed.slow.el.textContent = "Slow";
    this.speed.very_slow.el.textContent = "Very Slow";
    this.speed.el.selectedIndex = 2;

    this.save.el.textContent = "Save";
    this.run.el.textContent = "Run";
    this.prev.el.textContent = "Previous";
    this.next.el.textContent = "Next";
    this.play.el.textContent = "Play";

    this._saveClicked = eventHappened(this.save.el, "click");
    this._runClicked = eventHappened(this.run.el, "click");
    this._prevClicked = eventHappened(this.prev.el, "click");
    this._nextClicked = eventHappened(this.next.el, "click");
    this._playClicked = eventHappened(this.play.el, "click");

    for (const input of [this.speed,this.save,this.run,this.prev,this.next,this.play]){
      input.el.disabled = true;
    }
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


interface BaseSchema {
  readonly id: string;
}

class BaseSchemaImpl {
  public constructor(public id: string){}
}

interface Req2 {
  readonly req: string;
}

class ReqImpl {
  public constructor(public req: string){}
}

class ReqImpl2 {
  public constructor(public req: string){}
}

interface OtherSchema {
  readonly id: string;
  readonly other_id: string;
}

class Model<GenericSchema extends BaseSchema = BaseSchemaImpl, Req extends Req2 = ReqImpl> {
  public constructor(public what: GenericSchema){}
}

class Mugh<GenericSchema2 extends BaseSchema> extends Model<GenericSchema2> {

}

class Wugh extends Mugh<OtherSchema> {

}

const m = new Model("foo");

class A{}

class B{}


class Foo<T extends A, U extends A>{
  public constructor(public bob: T, public sue: U){}
}

class FooNum extends Foo<B, B>{

}

const foo_num:Foo<A, B> = new FooNum(1.2, "sdf");


function setup() {
  const top_el = document.getElementById("app");
  if (top_el === null) {
    throw Error(`Unable to find element with id "app"`);
  }
  top_el.textContent = "";

  class_registry.ide_cls = IDE;
  class_registry.top_left_cell_contents_cls = AlgoEditorArea;
  class_registry.bottom_left_cell_contents_cls = VizEditorArea;
  class_registry.inputs_cls = Inputs;
  // TODO extend

  //@ts-ignore
  const root_container = new TS_app_Container(top_el as HTMLDivElement);


  // these lines fail (and should)
  // root_container.content.ide.left_col.right_edge;
  // let ide = root_container.content.ide;
  // ide.el.textContent = "foo";
  // root_container.content.ide.left_col.top_left_cell.top_left_cell_contents.el.textContent = "foo";
}

setup();
