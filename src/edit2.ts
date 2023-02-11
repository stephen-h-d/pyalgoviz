import * as styles from "./edit_page.css";
import { build_app } from "./generated/classes";
import * as clses from "./generated/classes";
import { pyodide_ready } from "./py-worker";
import {VizOutput} from "./animator";
import { TabContent } from "./TabContent";
import { Inputs } from "./Inputs";
import { VizEditor } from "./VizEditor";
import { IDE } from "./IDE";
import { AlgoEditor } from "./AlgoEditor";


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
