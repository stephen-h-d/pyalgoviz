import { minimalSetup, EditorView } from "codemirror";
import { asyncRun } from "./py-worker";
import { executorScript } from "./executor";
import {select, arc} from "d3";
// import {Selection} from "d3";

const EDITOR_WIDTH = 600; // TODO make this more dynamic
const EDITOR_HEIGHT = 450; // TODO make this more dynamic
const RENDERING_SCALE = 1.0; // TODO make this more dynamic

const DELAY = {
    'Fast': 1,
    'Medium': 10,
    'MediumSlow': 25,
    'Slow': 50,
    'Snail': 200,
    'Molasses': 1000,
};

const STEPS = {
    'Fast': 20,
    'Medium': 100,
    'MediumSlow': 150,
    'Slow': 200,
    'Snail': 400,
    'Molasses': 800,
};

class EditorsMgr {
  public constructor(public algoView: EditorView, public vizView: EditorView) {}

  public save(event: MouseEvent) {
    fetch("api/save", {
      method: "POST",
      body: JSON.stringify({
        algo_script: this.algoView.state.doc.toString(),
        viz_script: this.vizView.state.doc.toString(),
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((result) => {})
      .catch((error) => {});
  }
}

function T(canvas: any,x,y,txt,size,font:string, color:string) {
    canvas.append('text').attr('x', x)
        .attr('y', y)
        .text(txt)
        .attr("font-size", ''+size+'px')
        .attr("font-family", font)
        .attr("fill", color);
}

function L(canvas: any,x1,y1,x2,y2,color,width) {
    canvas.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', color)
        .attr('stroke-width', width);
}

function R(canvas: any,x,y,w,h,fill,border) {
    canvas.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', h)
        .attr('fill', fill)
        .attr('stroke', border);
}

function C(canvas: any,x,y,r,fill,border) {
    canvas.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', r)
        .attr('fill', fill)
        .attr('stroke', border);
}

function A(canvas: any, x,y,r1,r2,start,end,color) {
    canvas.append('path')
        .attr('d',
                arc()
                .innerRadius(r1)
                .outerRadius(r2)
                .startAngle(start)
                .endAngle(end)
        )
        .attr('transform', "translate("+x+','+y+")")
        .attr('fill', color);
}

class Visualizer {
  private events: Array<[number,string,string]> = [];
  private currentEvent: number = 0;
  private lastError: string = "";
  // TODO canvas is a d3 Selection, but it requires 4 generic arguments.  figure out what they are
  private canvas: any | null = null;
  private timerId: number | null = null;

  public constructor(
    public algoEditor: EditorView,
    public outputArea: EditorView,
    public vizEditor: EditorView,
    public runButton: HTMLButtonElement,
    public playPauseButton: HTMLButtonElement,
    public renderAreaDiv: HTMLDivElement,
  ) {
  }

  public showRendering(script: string, w: number, h: number) {
    if (script) {
      this.renderAreaDiv.innerHTML = '';
      const svg = select(this.renderAreaDiv)
        .append("svg")
        .attr("width", w)
        .attr("height", h);
      this.canvas = svg
        .append("g")
        .attr("transform", "scale(" + RENDERING_SCALE + ")");

      eval(script);
      try {
      } catch (e) {
        T(this.canvas, 100, 100, "INTERNAL ERROR: ", 15, "Arial", "red");
        T(this.canvas, 100, 120, "" + e, 15, "Arial", "red");
        T(this.canvas, 100, 140, "" + script, 15, "Arial", "black");
      }
    }
  }

  public showEvent() {
    const e = this.events[this.currentEvent];
    try {

    //   this.vizEditor.setSelection( // TODO use lineHighlighter
    //     { line: e[0] - 1, ch: 0 },
    //     { line: e[0], ch: 0 }
    //   );

    //   progress.innerText = "Step " + (this.currentEvent + 1) + " of " + this.events.length; // TODO find/make `progress`

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
    // lastEvent = this.currentEvent;  TODO figure out if lastEvent is ever needed
  }

  public doNextStep() {
    if (this.currentEvent < this.events.length - 1) {
      this.currentEvent += 1;
      this.showEvent();
    }
  }

  public doPreviousStep() {
    if (this.currentEvent > 0) {
      this.currentEvent -= 1;
      this.showEvent();
    }
  }

  public doPlayPause() {
    if (this.playPauseButton.innerText == "Play") {
        this.playPauseButton.innerText = "Pause";
      if (this.currentEvent == this.events.length - 1) {
        this.currentEvent = 0;
      }
      this.animate();
    } else {
      this.currentEvent = this.events.length - 1;
      this.playPauseButton.innerText = "Play";
      setTimeout(this.showEvent, 1);
    }
  }

  public doAnimationStep() {
    // const speed = $("#speed").val() || "MediumSlow";
    const speed = "MediumSlow"; // TODO actually get speed from slider
    const last = this.events.length - 1;
    const step = Math.max(
      1,
      Math.round((Math.random() * this.events.length) / STEPS[speed])
    );
    if (this.currentEvent < last) {
      this.currentEvent = Math.min(this.currentEvent + step, last);
      this.showEvent();
    } else {
      if (this.timerId !== null) {
        window.clearInterval(this.timerId);
      }
      this.playPauseButton.innerText = "Play";
    }
  }

  public animate() {
    // const speed = $("#speed").val() || "MediumSlow";
    const speed = "MediumSlow";  // TODO actually get speed from slider


    this.timerId = window.setInterval(() => this.doAnimationStep(), DELAY[speed]);
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

  public async doRun() {
    // debugger;
    this.setOutputAreaText("Running...");

    // $('*').css('cursor','wait'); // TODO change the cursors somehow?
    this.runButton.disabled = true;
    this.playPauseButton.innerText = "Pause";

    const context = {
      script: this.algoEditor.state.doc.toString(),
      viz: this.vizEditor.state.doc.toString(),
      showVizErrors: true,
    };

    try {
      // TODO make this a bona fide results object so TS / VSCode doesn't complain
      const { py_error, events } = await asyncRun(executorScript, context);

    //   $("*").css("cursor", "auto");  // TODO change the cursors somehow?
      this.runButton.disabled = false;

      // TODO decide if this is necessary and where/when to run this
      // if (!data) { // used to be "data", now check for "error"?
      //    setTimeout(doRunScript, error_delay);
      //    return;
      // }

      this.events = events;
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
      this.lastError = "";
      if (py_error_lineno > 0) {
          this.lastError = py_error_msg;
      //   this.scriptEditor.setSelection( // TODO do error highlighting here with lineHighlighter
      //     { line: py_error_lineno - 1, ch: 0 },
      //     { line: py_error_lineno, ch: 0 }
      //   );
      }

      if (this.events !== undefined) {
        this.currentEvent = 0;
        this.playPauseButton.innerText = "Pause";
        this.animate();
      } else {
        console.error("events undefined after calling asyncRun");
      }
    } catch (e) {
      console.log(
        `Error in pyodideWorker: ${e}`
        //        `Error in pyodideWorker at ${e.filename}, Line: ${e.lineno}, ${e.message}`
      );
    }
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

function setup() {
  const scriptEditorDiv = get_div_element("algo_editor");
  const vizEditorDiv = get_div_element("viz_editor");
  const outputAreaDiv = get_div_element("text_output");
  const renderAreaDiv = get_div_element("render_area");

  const saveButton = get_button_element("save_button");
  const runButton = get_button_element("run_button");
  const previousButton = get_button_element("previous_button");
  const nextButton = get_button_element("next_button");
  const playPauseButton = get_button_element("play_pause_button");

  const algoView = new EditorView({
    doc: `
for x in range(50, 100, 50):
    for y in range(50, 100, 50):
        n = y / 50
    `,
    extensions: minimalSetup,
    parent: scriptEditorDiv,
  });

  const vizView = new EditorView({
    doc: `
from math import pi

text(x, y, "x=%s y=%s n=%d" % (x, y, n), size=10 + n*3, font="Arial", color='red')
rect(450, 50, 50 + n*10, 50 + n*10, fill="brown", border="lightyellow")
line(50, 50, x, y, color="purple", width=6)
circle(300, 200, n * 25, fill="transparent", border="green")
arc(100,
    325,
    innerRadius=50,
    outerRadius=100,
    startAngle=(n - 1) * 2 * pi/7,
    endAngle=n * 2 * pi/7,
    color="orange")
    `,
    extensions: minimalSetup,
    parent: vizEditorDiv,
  });

  const outputArea = new EditorView({
    doc: "",
    extensions: minimalSetup,
    parent: outputAreaDiv,
  });

  const visualizer = new Visualizer(algoView, outputArea, vizView, runButton, playPauseButton, renderAreaDiv);
  const editorsMgr = new EditorsMgr(algoView, vizView);

  saveButton.addEventListener("click", editorsMgr.save.bind(editorsMgr));
  runButton.addEventListener("click", async (event) => await visualizer.doRun());
  previousButton.addEventListener("click", async (event) => visualizer.doPreviousStep());
  nextButton.addEventListener("click", async (event) => visualizer.doNextStep());
  playPauseButton.addEventListener("click", async (event) => visualizer.doPlayPause());
}

setup();
