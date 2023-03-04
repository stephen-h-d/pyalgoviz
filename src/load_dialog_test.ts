import * as styles from "./load_dialog.css";
import { build_app } from "./generated/load_dialog_classes";
import * as clses from "./generated/load_dialog_classes";


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

  class LoadDialog extends clses.TS_app_Container {
    public constructor(els: clses.TS_app_ContainerElements) {
        super(els);
    }
  }

  function setup() {
    const top_el = document.getElementById("app");
    if (top_el === null || top_el.tagName.toLowerCase() != "div") {
      throw Error(`Unable to find div element with id "app": ${top_el}`);
    }
    top_el.textContent = "";

    const app = build_app({TS_app_Container_cls: LoadDialog});

    app.replaceEl(top_el as HTMLDivElement);

    // pyodide_ready.next(ready);
  }

  setup();
