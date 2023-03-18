import { select, arc } from "d3";
import { VizEvent } from "./exec_result";
import { EDITOR_WIDTH, EDITOR_HEIGHT, RENDERING_SCALE, T } from "./animator";

// @ts-ignore
export function T(canvas: Selection<SVGGElement, unknown, null, undefined>,x: number, y: number,txt: string,size: number,font:string, color:string) {
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

export function renderEvent(
  div: HTMLDivElement,
  event: VizEvent | null | undefined,
  w: number = EDITOR_WIDTH,
  h: number = EDITOR_HEIGHT) {
  div.textContent = '';
  if (event !== null && event !== undefined) {
    const svg = select(div)
      .append("svg")
      .attr("width", w)
      .attr("height", h);
    const canvas = svg
      .append("g")
      .attr("transform", "scale(" + RENDERING_SCALE + ")");

    try {
      eval(event.viz_output);
    } catch (e) {
      T(canvas, 100, 100, "INTERNAL ERROR: ", 15, "Arial", "red");
      T(canvas, 100, 120, "" + e, 15, "Arial", "red");
      T(canvas, 100, 140, "" + event.viz_output, 15, "Arial", "black");
    }
  }
}

