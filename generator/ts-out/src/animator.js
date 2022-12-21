import { select, arc } from "d3";
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
// @ts-ignore
function T(canvas, x, y, txt, size, font, color) {
    canvas.append('text').attr('x', x)
        .attr('y', y)
        .text(txt)
        .attr("font-size", '' + size + 'px')
        .attr("font-family", font)
        .attr("fill", color);
}
// @ts-ignore
function L(canvas, x1, y1, x2, y2, color, width) {
    canvas.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', color)
        .attr('stroke-width', width);
}
// @ts-ignore
function R(canvas, x, y, w, h, fill, border) {
    canvas.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', w)
        .attr('height', h)
        .attr('fill', fill)
        .attr('stroke', border);
}
// @ts-ignore
function C(canvas, x, y, r, fill, border) {
    canvas.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', r)
        .attr('fill', fill)
        .attr('stroke', border);
}
// @ts-ignore
function A(canvas, x, y, r1, r2, start, end, color) {
    const arcToAdd = arc()
        .innerRadius(r1)
        .outerRadius(r2)
        .startAngle(start)
        .endAngle(end);
    canvas.append('path')
        // @ts-ignore // not sure why this says it's invalid, but `attr()` can indeed take an `Arc` as it 2nd arg
        .attr('d', arcToAdd)
        .attr('transform', "translate(" + x + ',' + y + ")")
        .attr('fill', color);
}
export class Animator {
    vizOutputArea;
    playPauseButton;
    speedSelect;
    progressDiv;
    renderAreaDiv;
    events;
    setCurrentLine;
    setVizErrorLine;
    timerId;
    currentEvent = 0;
    paused = false;
    constructor(vizOutputArea, playPauseButton, speedSelect, progressDiv, renderAreaDiv, events, setCurrentLine, setVizErrorLine) {
        this.vizOutputArea = vizOutputArea;
        this.playPauseButton = playPauseButton;
        this.speedSelect = speedSelect;
        this.progressDiv = progressDiv;
        this.renderAreaDiv = renderAreaDiv;
        this.events = events;
        this.setCurrentLine = setCurrentLine;
        this.setVizErrorLine = setVizErrorLine;
        this.timerId = this.play();
    }
    pause() {
        this.speedSelect.disabled = false;
        this.paused = true;
        // TODO this is not quite right since play/pause is a different concept than run; fix it
        this.playPauseButton.innerText = "Play";
        window.clearInterval(this.timerId);
    }
    showRendering(script, w, h) {
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
            }
            catch (e) {
                T(canvas, 100, 100, "INTERNAL ERROR: ", 15, "Arial", "red");
                T(canvas, 100, 120, "" + e, 15, "Arial", "red");
                T(canvas, 100, 140, "" + script, 15, "Arial", "black");
            }
        }
    }
    showEvent() {
        const e = this.events[this.currentEvent];
        try {
            this.setCurrentLine(e[0]);
            this.progressDiv.innerText = "Step " + (this.currentEvent + 1) + " of " + this.events.length;
            //   $("#slider").slider("value", this.currentEvent);  TODO make slider
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
            }
            else {
                this.setVizErrorLine(-1);
                this.vizOutputArea.setText("");
            }
        }
        catch (exc) { }
        this.showRendering(e[1], EDITOR_WIDTH, EDITOR_HEIGHT - 5);
    }
    goToNextStep() {
        this.pause();
        if (this.currentEvent < this.events.length - 1) {
            this.currentEvent += 1;
            this.showEvent();
        }
    }
    goToPreviousStep() {
        this.pause();
        if (this.currentEvent > 0) {
            this.currentEvent -= 1;
            this.showEvent();
        }
    }
    goToPercentage(value) {
        const fraction = value / 100;
        const numSteps = this.events.length;
        this.currentEvent = Math.floor(fraction * numSteps);
        this.showEvent();
    }
    togglePaused() {
        if (this.paused) {
            if (this.currentEvent >= this.events.length - 1) {
                this.currentEvent = 0;
            }
            this.play();
        }
        else {
            this.pause();
        }
    }
    doAnimationStep() {
        const speed = this.speedSelect.value || "MediumSlow";
        const last = this.events.length - 1;
        const step = Math.max(1, Math.round((Math.random() * this.events.length) / (STEPS.get(speed) || 25)));
        if (this.currentEvent < last) {
            this.currentEvent = Math.min(this.currentEvent + step, last);
            this.showEvent();
        }
        else {
            this.pause();
        }
    }
    play() {
        this.paused = false;
        this.speedSelect.disabled = true;
        this.playPauseButton.innerText = "Pause";
        const speed = this.speedSelect.value || "MediumSlow";
        this.showEvent();
        this.timerId = window.setInterval(() => this.doAnimationStep(), DELAY.get(speed) || 25);
        return this.timerId;
    }
}
