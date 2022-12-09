import { asyncRun } from "./py-worker";
import { executorScript } from "./executor";
import { Editor } from "./editor";
import { Animator } from "./animator";

// TODO put this somewhere
// function doVizHelp() {
//   if ($('#stopButton span').html() == 'Stop') {
//       doStop()
//   }
//   function showHelp() {
//     outputArea.setValue(
//         "Python Algorithm Visualization Help\n" +
//         "--------------------------------------------------------------\n\n" +
//         "The visualization script in the bottom left visualizes the code in the top left while it runs. " +
//         "You can refer to all local variables used in the algorithm above. " +
//         "If an undefined local or other error is reached, the visualization script stops. " +
//         "Enable 'Show Errors' to show the errors causing the visualization script to stop. " +
//         "\n" +
//         "\nThe visualization script is executed once for each executed line in the algorithm. " +
//         "When the script runs, you can check the value of <b>__lineno__</b> to conditionally run " +
//         "a subset of your script to make the visualization act more like a breakpoint. " +
//         "\nYou can include arbitrary Python code, including defining helper functions." +
//         "\n" +
//         "\nAvailable values/primitives:" +
//         "\n * __lineno__" +
//         "\n * beep(frequency, milliseconds)" +
//         "\n * text(x, y, txt: string, size=13, font='Arial', color='black')" +
//         "\n * line(x1, y1, x2, y2, color='black', width=1)" +
//         "\n * rect(x, y, w, h, fill='white', border='black')" +
//         "\n * circle(x, y, radius, fill='white', border='black')" +
//         "\n * arc(cx, cy, innerRadius, outerRadius, startAngle, endAngle, color='black')" +
//         "\n * barchart(x, y, w, h, items, highlight=-1, scale=1, " +
//         "\n                                   fill='black', border='black')" +
//         ""
//     )
//   }
//   setTimeout(showHelp, 1)
// }

export class Visualizer {
  private animator: Animator | null = null;

  public constructor(
    private readonly algoEditor: Editor,
    private readonly outputArea: Editor,
    private readonly vizEditor: Editor,
    private readonly vizOutputArea: Editor,
    private readonly runButton: HTMLButtonElement,
    private readonly playPauseButton: HTMLButtonElement,
    private readonly speedSelect: HTMLSelectElement,
    private readonly renderAreaDiv: HTMLDivElement,
    private readonly progressDiv: HTMLDivElement
  ) {
    this.algoEditor.addDocChangedSubscriber(this.algoChanged.bind(this));
    this.vizEditor.addDocChangedSubscriber(this.vizScriptChanged.bind(this));
  }

  private algoChanged(){
    this.algoEditor.setErrorLine(-1);
    this.algoEditor.setHighlightLine(-1);
    // TODO reset play/pause/next/prev buttons
  }

  private vizScriptChanged(){
    this.vizEditor.setErrorLine(-1);
    this.vizEditor.setHighlightLine(-1);
  }

  public doPlayPause() {
    if (this.animator !== null) {
      this.animator.togglePaused();
    } else {
      console.error("Animator was unexpectedly null");
    }
  }

  public doNextStep() {
    if (this.animator !== null) {
      this.animator.goToNextStep();
    } else {
      console.error("Animator was unexpectedly null");
    }
  }

  public doPreviousStep() {
    if (this.animator !== null) {
      this.animator.goToPreviousStep();
    } else {
      console.error("Animator was unexpectedly null");
    }
  }

  public async doRun() {
    this.algoEditor.setErrorLine(-1);
    this.algoEditor.setReadOnly(true);
    this.vizEditor.setErrorLine(-1);
    this.vizEditor.setReadOnly(true);
    this.outputArea.setText("Running...");

    this.runButton.disabled = true;

    const context = {
      script: this.algoEditor.currentValue(),
      viz: this.vizEditor.currentValue(),
      showVizErrors: true,
    };

    try {
      const { py_error, events } = await asyncRun(executorScript, context);

      //   $("*").css("cursor", "auto");  // TODO change the cursors somehow?
      this.runButton.disabled = false;

      const py_error_msg = py_error.get("msg");
      const py_error_lineno = py_error.get("lineno");
      this.outputArea.setText(py_error_msg);
      // $("#slider").slider({ // TODO actually set up slider
      //   value: 1,
      //   step: 1,
      //   min: 0,
      //   max: this.events.length - 1,
      //   slide: handleSlide,
      // });
      if (py_error_lineno > 0) {
        // TODO figure out what to do with py_error_msg.
        this.algoEditor.setErrorLine(py_error_lineno);
      }

      if (events !== undefined) {
        if (this.animator !== null) {
          this.animator.pause();
        }

        this.animator = new Animator(
          this.vizOutputArea,
          this.playPauseButton, this.speedSelect, this.progressDiv,
          this.renderAreaDiv, events,
          this.algoEditor.setHighlightLine.bind(this.algoEditor),
          this.vizEditor.setErrorLine.bind(this.vizEditor));
      } else {
        console.error("events undefined after calling asyncRun");
      }
    } catch (e) {
      console.log(
        `Error in pyodideWorker: ${e}`
      );
    }

    this.algoEditor.setReadOnly(false);
    this.vizEditor.setReadOnly(false);
  }
}
