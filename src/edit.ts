import { setupEditorViews } from "./editorViews";
import { Editor } from "./editor";
import { Visualizer } from "./visualizer";
// import {Selection} from "d3";

class EditorsMgr {
  public constructor(public algoEditor: Editor, public vizEditor: Editor) {}

  public save(_event: MouseEvent) {
    fetch("api/save", {
      method: "POST",
      body: JSON.stringify({
        algo_script: this.algoEditor.currentValue(),
        viz_script: this.vizEditor.currentValue(),
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((_result) => {}) // TODO handle result
      .catch((_error) => {}); // TODO handle error
  }
}

function get_button_element(buttonId: string): HTMLButtonElement {
  const element = document.getElementById(buttonId);
  if (element === null) {
    throw new Error("Setting up button elements failed.");
  }
  if (element.nodeName !== "BUTTON") {
    const msg = `Expected nodeName of BUTTON but got ${element.nodeName}`;
    throw new Error(msg);
  }

  return element as HTMLButtonElement;
}

function get_div_element(divId: string): HTMLDivElement {
  const element = document.getElementById(divId);
  if (element === null) {
    throw new Error("Setting up div elements failed.");
  }
  if (element.nodeName !== "DIV") {
    const msg = `Expected nodeName of DIV but got ${element.nodeName}`;
    throw new Error(msg);
  }

  return element as HTMLDivElement;
}

function get_select_element(selectId: string): HTMLSelectElement {
  const element = document.getElementById(selectId);
  if (element === null) {
    throw new Error("Setting up select element failed.");
  }
  if (element.nodeName !== "SELECT") {
    const msg = `Expected nodeName of SELECT but got ${element.nodeName}`;
    throw new Error(msg);
  }

  return element as HTMLSelectElement;
}

function setup() {
  const scriptEditorDiv = get_div_element("algo_editor");
  const vizEditorDiv = get_div_element("viz_editor");
  const outputAreaDiv = get_div_element("text_output");
  const renderAreaDiv = get_div_element("render_area");
  const progressDiv = get_div_element("progress");

  const saveButton = get_button_element("save_button");
  const runButton = get_button_element("run_button");
  const previousButton = get_button_element("previous_button");
  const nextButton = get_button_element("next_button");
  const playPauseButton = get_button_element("play_pause_button");

  const speedSelect = get_select_element("speed");

  const { algoEditor, outputArea, vizEditor } = setupEditorViews(scriptEditorDiv, vizEditorDiv, outputAreaDiv);

  const visualizer = new Visualizer(algoEditor, outputArea, vizEditor, runButton, playPauseButton, speedSelect, renderAreaDiv, progressDiv);
  const editorsMgr = new EditorsMgr(algoEditor, vizEditor);

  saveButton.addEventListener("click", editorsMgr.save.bind(editorsMgr));
  runButton.addEventListener("click", async (_event) => await visualizer.doRun());
  previousButton.addEventListener("click", async (_event) => visualizer.doPreviousStep());
  nextButton.addEventListener("click", async (_event) => visualizer.doNextStep());
  playPauseButton.addEventListener("click", async (_event) => visualizer.doPlayPause());
}

setup();
