import { setupEditorViews } from "./editorViews";
import { Editor } from "./editor";
import { Visualizer } from "./visualizer";
import { top_resize_edge, bottom_resize_edge, left_resize_edge, right_resize_edge, runInputs } from './edit.css.js';
import { top_left_cell, bottom_left_cell, top_right_cell, bottom_right_cell } from './edit.css.js';
import { ide, scriptEditor, scriptEditorWrapper } from './edit.css.js';
import { body, root } from './edit.css.js';
import {firstRowHeight, secondRowHeight} from './edit.css.js';
const firstRowHeightName = firstRowHeight.replace("var(","").replace(")","");
const secondRowHeightName = secondRowHeight.replace("var(","").replace(")","");

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

function div(classNames: string[] = [], parent?: HTMLDivElement) {
  const result = document.createElement("div");
  for (const className of classNames) {
    for (const sub of className.split(" ")) {
      result.classList.add(sub);
    }
  }

  if (parent !== undefined) {
    parent.appendChild(result);
  }

  return result;
}

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

type IDERow = [HTMLDivElement, HTMLDivElement];

class IDE {
  public readonly ideDiv: HTMLDivElement;
  public readonly rows: [IDERow, IDERow];

  private setup_edge(edge: HTMLDivElement, row: number, col: number, vertical: boolean) {
    edge.addEventListener("mousedown", (ev: MouseEvent) => {
      ev.preventDefault();
      const original_mouse_x = ev.pageX;
      const original_mouse_y = ev.pageY;
      const other_row = (row + 1) % 2;
      const other_cell = this.rows[other_row][col];
      const cell = this.rows[row][col];
      const original_height = Number(getComputedStyle(cell, null).getPropertyValue('y').replace('px', ''));
      const original_other_height = Number(getComputedStyle(other_cell, null).getPropertyValue('ysdfsdf').replace('px', ''));
      const original_rect = cell.getBoundingClientRect();
      const original_other_rect = other_cell.getBoundingClientRect();
      const original_ide_rect = this.ideDiv.getBoundingClientRect();
      const total_height = original_ide_rect.height;
      const top_y = this.ideDiv.getBoundingClientRect().y;

      // console.log(original_height);
      // console.log(original_other_height);
      // console.log(ev.target);
      // console.log("other", original_other_rect);
      // console.log("cell", original_rect);
      // console.log("other row", other_row);
      // console.log("other top",other_cell.clientTop);
      // console.log("top",cell.clientTop);
      // console.log("other bottom",other_cell.clientTop + other_cell.clientHeight);
      // console.log("bottom",cell.clientTop + cell.clientHeight);
      // console.log("pageY",ev.pageY);

      // (mouse_y - top_y) / original_total_height
      const ideDiv = this.ideDiv;

      if (vertical) { // is horizontal edge, i.e. the edges move vertically
        function mouse_moved(ev: MouseEvent) {
          const newTopRowPct = (ev.pageY - top_y) / total_height * 100;
          const newBottomRowPct = 100 - newTopRowPct;
          console.log("newTopRowPct", newTopRowPct);
          console.log("secondRowHeightName var", secondRowHeightName);
          // debugger;
          ideDiv.style.setProperty(firstRowHeightName, `${newTopRowPct}%`);
          ideDiv.style.setProperty(secondRowHeightName, `${newBottomRowPct}%`);
        }

        document.addEventListener("mousemove", mouse_moved); // TODO debounce this
        document.addEventListener("mouseup", (ev: MouseEvent) => {
          document.removeEventListener("mousemove",mouse_moved);
        });

        // if (row == 0) {
        //   const other = this.rows[1][col];
        //   console.log(other.clientHeight);
        // } else if (row == 1) {
        //   const other = this.rows[0][col];
        //   console.log(other.clientHeight);

        // } else {
        //   throw new Error(`unexpected row ${row}`);
        // }
      }
    });
  }

  private cell(className: string, edges: string, row: number, col: number): HTMLDivElement {
    const result = div([className]);
    for (const edge of edges) {
      switch (edge) {
        case 't':
          const top_edge = div([top_resize_edge], result);
          this.setup_edge(top_edge, row, col, true);
          break;
        case 'b':
          const bottom_edge = div([bottom_resize_edge], result);
          this.setup_edge(bottom_edge, row, col, true);
          break;
        case 'l':
          div([left_resize_edge], result);
          break;
        case 'r':
          div([right_resize_edge], result);
          break;
        default:
          throw new Error(`unexpected edge: ${edge}`);
      }
    }
    return result;
  }

  public constructor(){
    this.ideDiv = div([ide]);
    this.rows = [[this.cell(top_left_cell, "br", 0, 0), this.cell(top_right_cell, "bl", 0, 1)],
                 [this.cell(bottom_left_cell, "tr", 1, 0), this.cell(bottom_right_cell, "tl", 1, 1)]];
    for (const row of this.rows) {
      for (const cell of row) {
        this.ideDiv.appendChild(cell);
      }
    }
  }
}

function setup() {

  document.body.className = body;

  const rootDiv = get_div_element("root");
  rootDiv.textContent = '';
  rootDiv.classList.add(root);
  console.log(firstRowHeight);
  console.log(secondRowHeight);

  const speedSelect = document.createElement("select");

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

  const progressDiv = div();
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
  const rangeSlider = document.createElement("input");
  rangeSlider.type = "range";
  // TODO likely need to set min and max dynamically after each run
  rangeSlider.min = "1";
  rangeSlider.max = "100";
  rangeSlider.value = "1";

  const ide = new IDE();
  rootDiv.appendChild(ide.ideDiv);

  const algoEditorWrapperDiv = div([scriptEditorWrapper]);
  const algoEditorDiv = div([scriptEditor], algoEditorWrapperDiv);
  const vizEditorWrapperDiv = div([scriptEditorWrapper]);
  const vizEditorDiv = div([scriptEditor], vizEditorWrapperDiv);
  const scriptOutputAreaDiv = div();
  const vizOutputAreaDiv = div();
  const renderAreaDiv = div();
  const runInputsDiv = div([runInputs]);
  ide.rows[0][0].appendChild(algoEditorWrapperDiv);
  ide.rows[0][0].appendChild(runInputsDiv);
  runInputsDiv.appendChild(saveButton);
  runInputsDiv.appendChild(runButton);
  runInputsDiv.appendChild(speedSelect);
  runInputsDiv.appendChild(previousButton);
  runInputsDiv.appendChild(nextButton);
  runInputsDiv.appendChild(playPauseButton);
  runInputsDiv.appendChild(rangeSlider);
  ide.rows[0][1].appendChild(renderAreaDiv);
  ide.rows[1][0].appendChild(vizEditorDiv);
  ide.rows[1][1].appendChild(vizOutputAreaDiv);

  const { algoEditor, outputArea, vizEditor, scriptOutputArea } = setupEditorViews(algoEditorDiv, vizEditorDiv, scriptOutputAreaDiv);

  const visualizer = new Visualizer(algoEditor, outputArea, vizEditor, scriptOutputArea, runButton, playPauseButton, speedSelect, renderAreaDiv, progressDiv);
  const editorsMgr = new EditorsMgr(algoEditor, vizEditor);

  saveButton.addEventListener("click", editorsMgr.save.bind(editorsMgr));
  runButton.addEventListener("click", async (_event) => await visualizer.doRun());
  previousButton.addEventListener("click", async (_event) => visualizer.doPreviousStep());
  nextButton.addEventListener("click", async (_event) => visualizer.doNextStep());
  playPauseButton.addEventListener("click", async (_event) => visualizer.doPlayPause());
  rangeSlider.addEventListener("change", async (_event) => visualizer.handleRangeChanged(Number(rangeSlider.value)))
}

setup();
