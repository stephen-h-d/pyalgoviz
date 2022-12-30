import * as styles from "./edit_page.css";
import { class_registry, TS_app_Container, TS_ide_Container, TS_left_col_Container, TS_right_col_Container } from "./generated/classes";

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

// function assignStyles(children: VanillaPageDecl[], containers: object[]){

// }

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

class TS_left_col_Container_spec extends TS_left_col_Container {
  public constructor(public readonly el: HTMLDivElement) {
    super(el);

    const left_rows_md_listener = create_resize_row_listener(el, "--row-11-height", "--row-12-height");
    this.bottom_left_cell.left_top_edge.el.addEventListener("mousedown", left_rows_md_listener);
    this.top_left_cell.left_bottom_edge.el.addEventListener("mousedown", left_rows_md_listener);

  }
}

class TS_right_col_Container_spec extends TS_right_col_Container {
  public constructor(public readonly el: HTMLDivElement) {
    super(el);

    const right_rows_md_listener = create_resize_row_listener(el, "--row-21-height", "--row-22-height");
    this.bottom_right_cell.right_top_edge.el.addEventListener("mousedown", right_rows_md_listener);
    this.top_right_cell.right_bottom_edge.el.addEventListener("mousedown", right_rows_md_listener);

  }
}

class TS_ide_Container_spec extends TS_ide_Container {
  public constructor(public readonly el: HTMLDivElement) {
    super(el);

    const resize_cols_listener = create_resize_col_listener(el, "--col-1-width", "--col-2-width");
    this.left_col.right_edge.el.addEventListener("mousedown", resize_cols_listener);
    this.right_col.left_edge.el.addEventListener("mousedown", resize_cols_listener);
  }
}

function setup() {
  const top_el = document.getElementById("app");
  if (top_el === null) {
    throw Error(`Unable to find element with id "app"`);
  }
  top_el.textContent = "";

  class_registry.left_col_cls = TS_left_col_Container_spec;
  class_registry.right_col_cls = TS_right_col_Container_spec;
  class_registry.ide_cls = TS_ide_Container_spec;

  const root_container = new TS_app_Container(top_el as HTMLDivElement);

  root_container.header.el.textContent = "PyAlgoViz 2.0";
  root_container.header.el.classList.add(styles.header_style);

  root_container.content.ide.left_col.top_left_cell.el.classList.add(styles.cell_style);
  root_container.content.ide.left_col.bottom_left_cell.el.classList.add(styles.cell_style);
  root_container.content.ide.right_col.top_right_cell.el.classList.add(styles.cell_style);
  root_container.content.ide.right_col.bottom_right_cell.el.classList.add(styles.cell_style);

  // root_container.content.ide.left_col.top_left_cell.el.textContent = "top left";
  // root_container.content.ide.left_col.bottom_left_cell.el.textContent = "bottom left";
  // root_container.content.ide.right_col.top_right_cell.el.textContent = "top right";
  // root_container.content.ide.right_col.bottom_right_cell.el.textContent = "bottom right";
}

setup();
