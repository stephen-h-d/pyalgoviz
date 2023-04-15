import { Editor } from "./editor";
import { select, arc, Selection } from "d3";

export const EDITOR_WIDTH = 600; // TODO make this more dynamic
export const EDITOR_HEIGHT = 450; // TODO make this more dynamic
export const RENDERING_SCALE = 1.0; // TODO make this more dynamic

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function T(canvas: Selection<SVGGElement, unknown, null, undefined>,x: number, y: number,txt: string,size: number,font:string, color:string) {
  canvas.append('text').attr('x', x)
      .attr('y', y)
      .text(txt)
      .attr("font-size", ''+size+'px')
      .attr("font-family", font)
      .attr("fill", color);
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
function L(canvas: Selection<SVGGElement, unknown, null, undefined>,x1: number,y1: number,x2: number,y2: number,color: string,width: number) {
  canvas.append('line')
      .attr('x1', x1)
      .attr('y1', y1)
      .attr('x2', x2)
      .attr('y2', y2)
      .attr('stroke', color)
      .attr('stroke-width', width);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function R(canvas: Selection<SVGGElement, unknown, null, undefined>,x: number, y: number,w: number,h: number,fill: string,border: string) {
  canvas.append('rect')
      .attr('x', x)
      .attr('y', y)
      .attr('width', w)
      .attr('height', h)
      .attr('fill', fill)
      .attr('stroke', border);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function C(canvas: Selection<SVGGElement, unknown, null, undefined>,x: number, y: number,r: number,fill: string,border: string) {
  canvas.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', r)
      .attr('fill', fill)
      .attr('stroke', border);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function A(canvas: Selection<SVGGElement, unknown, null, undefined>, x: number, y: number,r1: number,r2: number,start: number,end: number,color: string) {
  const arcData = {
    innerRadius: r1,
    outerRadius: r2,
    startAngle: start,
    endAngle: end,
  };

  const arcToAdd = arc()
    .innerRadius(d => d.innerRadius)
    .outerRadius(d => d.outerRadius)
    .startAngle(d => d.startAngle)
    .endAngle(d => d.endAngle);

  // Pass the data object to the arcToAdd function.  It's a little redundant, but
  // this was done to avoid TSC errors
  canvas.append('path')
    .attr('d', arcToAdd(arcData))
    .attr('transform', "translate("+x+','+y+")")
    .attr('fill', color);

}

export class Animator {
  private timerId: number;
  private currentEvent = 0;
  private paused = false;

  public constructor(
    private readonly vizOutputArea: Editor,
    private readonly playPauseButton: HTMLButtonElement,
    private readonly speedSelect: HTMLSelectElement,
    private readonly progressDiv: HTMLDivElement,
    private readonly renderAreaDiv: HTMLDivElement,
    private readonly events: Array<[number, string, Map<string, number | string> | null]>,
    private readonly setCurrentLine: (currentLine: number) => void,
    private readonly setVizErrorLine: (currentLine: number) => void
  ) {
    console.log("num events", events.length);
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
    this.renderAreaDiv.textContent = '';
    if (script) {
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

      // let output = "";
      // for (let n = 0; n <= this.currentEvent; n++) {
      //   output += this.events[n][2];
      // }
      // if (output) {
      //   this.setOutputAreaText(output + this.lastError);
      // }
      if (e[2] !== null && e[2] !== undefined) {
        this.setVizErrorLine(Number(e[2].get("line")));
        this.vizOutputArea.setText(String(e[2].get("error")));
      } else {
        this.setVizErrorLine(-1);
        this.vizOutputArea.setText("");
      }
    } catch (exc) {
      console.error(exc);
    }
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

  public goToPercentage(value: number) {
    const fraction = value / 100;
    const numSteps = this.events.length;
    this.currentEvent = Math.floor(fraction * numSteps);
    this.showEvent();
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
}
