import { asyncRun } from "./py-worker.js";
import { executorScript } from "./executor.js";
import {minimalSetup, EditorView} from "codemirror";

const DELAY = {
    'Fast': 1,
    'Medium': 10,
    'MediumSlow': 25,
    'Slow': 50,
    'Snail': 200,
    'Molasses': 1000,
}

function doVizHelp() {
    if ($('#stopButton span').html() == 'Stop') {
        doStop()
    }
    function showHelp() {
      outputArea.setValue(
          "Python Algorithm Visualization Help\n" +
          "--------------------------------------------------------------\n\n" +
          "The visualization script in the bottom left visualizes the code in the top left while it runs. " +
          "You can refer to all local variables used in the algorithm above. " +
          "If an undefined local or other error is reached, the visualization script stops. " +
          "Enable 'Show Errors' to show the errors causing the visualization script to stop. " +
          "\n" +
          "\nThe visualization script is executed once for each executed line in the algorithm. " +
          "When the script runs, you can check the value of <b>__lineno__</b> to conditionally run " +
          "a subset of your script to make the visualization act more like a breakpoint. " +
          "\nYou can include arbitrary Python code, including defining helper functions." +
          "\n" +
          "\nAvailable values/primitives:" +
          "\n * __lineno__" +
          "\n * beep(frequency, milliseconds)" +
          "\n * text(x, y, txt, size=13, font='Arial', color='black')" +
          "\n * line(x1, y1, x2, y2, color='black', width=1)" +
          "\n * rect(x, y, w, h, fill='white', border='black')" +
          "\n * circle(x, y, radius, fill='white', border='black')" +
          "\n * arc(cx, cy, innerRadius, outerRadius, startAngle, endAngle, color='black')" +
          "\n * barchart(x, y, w, h, items, highlight=-1, scale=1, " +
          "\n                                   fill='black', border='black')" +
          ""
      )
    }
    setTimeout(showHelp, 1)
}


async function handleRunButtonClicked(event) {
    doRunScript();
}

async function handlePreviousButtonClicked(event) {
    doPreviousStep();
}

async function handleNextButtonClicked(event) {
    doNextStep();
}

async function handleStopButtonClicked(event) {
    doStop();
}


function setup() {
    const outputAreaDiv: HTMLElement | null = document.getElementById("text_output");

    const outputArea = new EditorView({doc: "", extensions: minimalSetup, parent: outputAreaDiv});

    const runButton = document.getElementById("runButton");
    runButton.addEventListener("click", handleRunButtonClicked);

    const previousButton = document.getElementById("previousButton");
    previousButton.addEventListener("click", handlePreviousButtonClicked);

    const nextButton = document.getElementById("nextButton");
    nextButton.addEventListener("click", handleNextButtonClicked);

    const stopButton = document.getElementById("stopButton");
    stopButton.addEventListener("click", handleStopButtonClicked);
}
