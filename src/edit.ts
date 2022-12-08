import { setupEditorViews } from "./editorViews";
import { Editor } from "./editor";
import { Visualizer } from "./visualizer";

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
  import.meta.hot.accept(reloadModule)
}
// End HMR Setup.

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

function setup() {

  const rootDiv = get_div_element("root");
  rootDiv.textContent = '';

  const speedSelect = document.createElement("select");
  rootDiv.appendChild(speedSelect);

  const fastOption = document.createElement("option");
  fastOption.textContent = "Fast";
  const mediumOption = document.createElement("option");
  mediumOption.textContent = "Medium7";
  const slowOption = document.createElement("option");
  slowOption.textContent = "Slow";
  const snailOption = document.createElement("option");
  snailOption.textContent = "Snail";
  const molassesOption = document.createElement("option");
  molassesOption.textContent = "Molasses";
  speedSelect.appendChild(fastOption);
  speedSelect.appendChild(mediumOption);
  speedSelect.appendChild(slowOption);
  speedSelect.appendChild(snailOption);
  speedSelect.appendChild(molassesOption);

  speedSelect.selectedIndex = 1;

  const progressDiv = document.createElement("div");
  progressDiv.className = "progress moveup";

  const saveButton = document.createElement("button");
  saveButton.textContent = "Save";
  const runButton = document.createElement("button");
  runButton.textContent = "Run";
  const previousButton = document.createElement("button");
  previousButton.textContent = "Prev";
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  const playPauseButton = document.createElement("button");
  playPauseButton.textContent = "Play";
  rootDiv.appendChild(saveButton);
  rootDiv.appendChild(runButton);
  rootDiv.appendChild(previousButton);
  rootDiv.appendChild(nextButton);
  rootDiv.appendChild(playPauseButton);

  const scriptEditorDiv = document.createElement("div");
  const vizEditorDiv = document.createElement("div");
  const scriptOutputAreaDiv = document.createElement("div");
  const vizOutputAreaDiv = document.createElement("div");
  const renderAreaDiv = document.createElement("div");
  rootDiv.appendChild(scriptEditorDiv);
  rootDiv.appendChild(vizEditorDiv);
  rootDiv.appendChild(scriptOutputAreaDiv);
  rootDiv.appendChild(vizOutputAreaDiv);
  rootDiv.appendChild(renderAreaDiv);

  const { algoEditor, outputArea, vizEditor, scriptOutputArea } = setupEditorViews(scriptEditorDiv, vizEditorDiv, scriptOutputAreaDiv);

  const visualizer = new Visualizer(algoEditor, outputArea, vizEditor, scriptOutputArea, runButton, playPauseButton, speedSelect, renderAreaDiv, progressDiv);
  const editorsMgr = new EditorsMgr(algoEditor, vizEditor);

  saveButton.addEventListener("click", editorsMgr.save.bind(editorsMgr));
  runButton.addEventListener("click", async (_event) => await visualizer.doRun());
  previousButton.addEventListener("click", async (_event) => visualizer.doPreviousStep());
  nextButton.addEventListener("click", async (_event) => visualizer.doNextStep());
  playPauseButton.addEventListener("click", async (_event) => visualizer.doPlayPause());
}

setup();
