import * as styles from "./edit_page.css";
import { TS_app_Container } from "./generated/classes";

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

function setup() {
  const top_el = document.getElementById("app");
  if (top_el === null) {
    throw Error(`Unable to find element with id "app"`);
  }
  top_el.textContent = "";

  const root_container = new TS_app_Container(top_el as HTMLDivElement);

  root_container.header.el.textContent = "PyAlgoViz 2.0";
  root_container.header.el.classList.add(styles.header_style);
  
  root_container.content.ide.left_col.top_left_cell.el.classList.add(styles.cell_style);
  root_container.content.ide.left_col.bottom_left_cell.el.classList.add(styles.cell_style);
  root_container.content.ide.right_col.top_right_cell.el.classList.add(styles.cell_style);
  root_container.content.ide.right_col.bottom_right_cell.el.classList.add(styles.cell_style);

  root_container.content.ide.left_col.top_left_cell.el.textContent = "top left";
  root_container.content.ide.left_col.bottom_left_cell.el.textContent = "bottom left";
  root_container.content.ide.right_col.top_right_cell.el.textContent = "top right";
  root_container.content.ide.right_col.bottom_right_cell.el.textContent = "bottom right";
}

setup();
