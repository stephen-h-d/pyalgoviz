import { setupEditorViews } from "./editorViews";
import { Visualizer } from "./visualizer";
import { top_resize_edge, bottom_resize_edge, left_resize_edge, right_resize_edge, runInputs } from './edit.css.js';
import { top_left_cell, bottom_left_cell, top_right_cell, bottom_right_cell } from './edit.css.js';
import { ide, scriptEditor, scriptEditorWrapper } from './edit.css.js';
import { body, root } from './edit.css.js';
import { firstRowHeight, secondRowHeight } from './edit.css.js';
// Begin HMR Setup
// I am not 100% sure if this section is necessary to make HMR work,
// but it seems to ensure that it does.  The setup() function essentially
// recreates the entire page every time this module is reloaded.
// The only thing it doesn't do is reload
// pyodide.  That is what is handy about it for us, since we don't often
// need to reload pyodide, and it takes a while.
function reloadModule(newModule) {
    console.log("newModule: ", newModule, "reloading entire page");
}
if (import.meta.hot) {
    import.meta.hot.accept(reloadModule);
}
// End HMR Setup.
function div(classNames = [], parent) {
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
    algoEditor;
    vizEditor;
    constructor(algoEditor, vizEditor) {
        this.algoEditor = algoEditor;
        this.vizEditor = vizEditor;
    }
    save(_event) {
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
            .then((_result) => { }) // TODO handle result
            .catch((_error) => { }); // TODO handle error
    }
}
function get_div_element(divId) {
    const element = document.getElementById(divId);
    if (element === null) {
        throw new Error("Setting up div elements failed.");
    }
    if (element.nodeName !== "DIV") {
        const msg = `Expected nodeName of DIV but got ${element.nodeName}`;
        throw new Error(msg);
    }
    return element;
}
class IDE {
    ideDiv;
    rows;
    static cell(className) {
        const result = div([className]);
        div([left_resize_edge], result);
        div([right_resize_edge], result);
        div([top_resize_edge], result);
        div([bottom_resize_edge], result);
        return result;
    }
    constructor() {
        this.ideDiv = div([ide]);
        this.rows = [[IDE.cell(top_left_cell), IDE.cell(top_right_cell)], [IDE.cell(bottom_left_cell), IDE.cell(bottom_right_cell)]];
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
    rangeSlider.addEventListener("change", async (_event) => visualizer.handleRangeChanged(Number(rangeSlider.value)));
}
setup();
