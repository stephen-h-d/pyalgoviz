import { EditorView } from "codemirror";
import { asyncRun } from "./py-worker";
import { executorScript } from "./executor";
import { Editor } from "./editor";
import {select, arc, Selection} from "d3";

// @ts-ignore
function T(canvas: Selection<SVGGElement, unknown, null, undefined>,x: number, y: number,txt: string,size: number,font:string, color:string) {
  canvas.append('text').attr('x', x)
      .attr('y', y)
      .text(txt)
      .attr("font-size", ''+size+'px')
      .attr("font-family", font)
      .attr("fill", color);
}

// @ts-ignore
function L(canvas: Selection<SVGGElement, unknown, null, undefined>,x1: number,y1: number,x2: number,y2: number,color: string,width: number) {
  canvas.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', color)
      .attr('stroke-width', width);
}

// @ts-ignore
function R(canvas: Selection<SVGGElement, unknown, null, undefined>,x: number, y: number,w: number,h: number,fill: string,border: string) {
  canvas.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', fill)
      .attr('stroke', border);
}

// @ts-ignore
function C(canvas: Selection<SVGGElement, unknown, null, undefined>,x: number, y: number,r: number,fill: string,border: string) {
  canvas.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', r)
      .attr('fill', fill)
      .attr('stroke', border);
}

// @ts-ignore
function A(canvas: Selection<SVGGElement, unknown, null, undefined>, x: number, y: number,r1: number,r2: number,start: number,end: number,color: string) {
  const arcToAdd = arc()
    .innerRadius(r1)
    .outerRadius(r2)
    .startAngle(start)
    .endAngle(end);

  canvas.append('path')
      // @ts-ignore // not sure why this says it's invalid, but `attr()` can indeed take an `Arc` as it 2nd arg
      .attr('d', arcToAdd)
      .attr('transform', "translate("+x+','+y+")")
      .attr('fill', color);
}

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

const EDITOR_WIDTH = 600; // TODO make this more dynamic
const EDITOR_HEIGHT = 450; // TODO make this more dynamic
const RENDERING_SCALE = 1.0; // TODO make this more dynamic

const DELAY = new Map([
    ['Fast', 1],
    ['Medium', 10],
    ['MediumSlow', 25],
    ['Slow', 50],
    ['Snail', 200],
    ['Molasses', 1000],
]);

const STEPS = new Map([
    ['Fast', 20],
    ['Medium', 100],
    ['MediumSlow', 150],
    ['Slow', 200],
    ['Snail', 400],
    ['Molasses', 800],
]);

class Animator {
  private timerId: number;
  private currentEvent: number = 0;
  private paused: boolean = false;

  public constructor(
    private readonly outputArea: EditorView,
    private readonly playPauseButton: HTMLButtonElement,
    private readonly speedSelect: HTMLSelectElement,
    private readonly progressDiv: HTMLDivElement,
    private readonly renderAreaDiv: HTMLDivElement,
    private readonly events: Array<[number,string,string]>,
    private readonly lastError: string,
    private readonly setCurrentLine: (currentLine: number)=> void,
  ) {
    this.timerId = this.play();
  }

  public pause() {
    this.speedSelect.disabled = false;
    this.paused = true;
    // TODO this is not quite right since play/pause is a different concept than run; fix it
    this.playPauseButton.innerText = "Play";
    window.clearInterval(this.timerId);
  }

  public showRendering(script: string, w: number, h: number) {
    if (script) {
      this.renderAreaDiv.innerHTML = '';
      const svg = select(this.renderAreaDiv)
        .append("svg")
        .attr("width", w)
        .attr("height", h);
      const canvas = svg
        .append("g")
        .attr("transform", "scale(" + RENDERING_SCALE + ")");

      try {
        eval(script);
      } catch (e) {
        T(canvas, 100, 100, "INTERNAL ERROR: ", 15, "Arial", "red");
        T(canvas, 100, 120, "" + e, 15, "Arial", "red");
        T(canvas, 100, 140, "" + script, 15, "Arial", "black");
      }
    }
  }

  public showEvent() {
    const e = this.events[this.currentEvent];
    try {

    this.setCurrentLine(e[0]);

    this.progressDiv.innerText = "Step " + (this.currentEvent + 1) + " of " + this.events.length;

    //   $("#slider").slider("value", this.currentEvent);  TODO make slider

      let output = "";
      for (let n = 0; n <= this.currentEvent; n++) {
        output += this.events[n][2];
      }
      if (output) {
        this.setOutputAreaText(output + this.lastError);
      }
    } catch (exc) {}
    this.showRendering(e[1], EDITOR_WIDTH, EDITOR_HEIGHT - 5);
  }

  public goToNextStep() {
    this.pause();
    if (this.currentEvent < this.events.length - 1) {
      this.currentEvent += 1;
      this.showEvent();
    }
  }

  public goToPreviousStep() {
    this.pause();
    if (this.currentEvent > 0) {
      this.currentEvent -= 1;
      this.showEvent();
    }
  }

  public togglePaused() {
    if (this.paused) {
      if (this.currentEvent >= this.events.length - 1) {
        this.currentEvent = 0;
      }
      this.play();
    } else {
      this.pause();
    }
  }

  public doAnimationStep() {
    const speed = this.speedSelect.value || "MediumSlow";
    const last = this.events.length - 1;
    const step = Math.max(
      1,
      Math.round((Math.random() * this.events.length) / (STEPS.get(speed) || 25))
    );
    if (this.currentEvent < last) {
      this.currentEvent = Math.min(this.currentEvent + step, last);
      this.showEvent();
    } else {
      this.pause();
    }
  }

  public play() {
    this.paused = false;
    this.speedSelect.disabled = true;
    this.playPauseButton.innerText = "Pause";
    const speed = this.speedSelect.value || "MediumSlow";
    this.showEvent();
    this.timerId = window.setInterval(() => this.doAnimationStep(), DELAY.get(speed) || 25);
    return this.timerId;
  }

  private setOutputAreaText(text: string) {
    // TODO figure out a way to reduce the duplication here... perhaps
    // some functions that operate on `EditorView`s.
    const transaction = this.outputArea.state.update({
        changes: {
          from: 0,
          to: this.outputArea.state.doc.length,
          insert: text,
        },
      });
      const update = this.outputArea.state.update(transaction);
      this.outputArea.update([update]);
  }
}

export class Visualizer {
  private animator: Animator | null = null;

  public constructor(
    private readonly algoEditor: Editor,
    private readonly outputArea: EditorView,
    private readonly vizEditor: Editor,
    private readonly runButton: HTMLButtonElement,
    private readonly playPauseButton: HTMLButtonElement,
    private readonly speedSelect: HTMLSelectElement,
    private readonly renderAreaDiv: HTMLDivElement,
    private readonly progressDiv: HTMLDivElement
  ) {
  }

  private setOutputAreaText(text: string) {
    const transaction = this.outputArea.state.update({
      changes: {
        from: 0,
        to: this.outputArea.state.doc.length,
        insert: text,
      },
    });
    const update = this.outputArea.state.update(transaction);
    this.outputArea.update([update]);
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
    this.setOutputAreaText("Running...");

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
      this.setOutputAreaText(py_error_msg);
      // $("#slider").slider({ // TODO actually set up slider
      //   value: 1,
      //   step: 1,
      //   min: 0,
      //   max: this.events.length - 1,
      //   slide: handleSlide,
      // });
      let lastError = "";
      if (py_error_lineno > 0) {
        lastError = py_error_msg;
        this.algoEditor.setErrorLine(py_error_lineno);
      }

      if (events !== undefined) {
        if (this.animator !== null) {
          this.animator.pause();
        }

        this.animator = new Animator(this.outputArea, this.playPauseButton, this.speedSelect, this.progressDiv, this.renderAreaDiv, events, lastError, this.algoEditor.setHighlightLine.bind(this.algoEditor));
      } else {
        console.error("events undefined after calling asyncRun");
      }
    } catch (e) {
      console.log(
        `Error in pyodideWorker: ${e}`
      );
    }
  }
}
