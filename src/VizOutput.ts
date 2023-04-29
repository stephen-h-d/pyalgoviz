import { Selection, select, arc } from 'd3';
import { VizEvent } from './exec_result';
const EDITOR_WIDTH = 600; // TODO make this more dynamic
const EDITOR_HEIGHT = 450; // TODO make this more dynamic
const RENDERING_SCALE = 1.0; // TODO make this more dynamic

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function T(
  canvas: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  txt: string,
  size: number,
  font: string,
  color: string,
) {
  canvas
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .text(txt)
    .attr('font-size', '' + size + 'px')
    .attr('font-family', font)
    .attr('fill', color);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function L(
  canvas: Selection<SVGGElement, unknown, null, undefined>,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
) {
  canvas
    .append('line')
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('stroke', color)
    .attr('stroke-width', width);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function R(
  canvas: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  border: string,
) {
  canvas
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h)
    .attr('fill', fill)
    .attr('stroke', border);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function C(
  canvas: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  r: number,
  fill: string,
  border: string,
) {
  canvas
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', r)
    .attr('fill', fill)
    .attr('stroke', border);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function A(
  canvas: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  r1: number,
  r2: number,
  start: number,
  end: number,
  color: string,
) {
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

  // Pass the data object to the arcToAdd function.  passing
  // the `arcToAdd` function directly works as well, but TSC complains
  canvas
    .append('path')
    .attr('d', arcToAdd(arcData))
    .attr('transform', 'translate(' + x + ',' + y + ')')
    .attr('fill', color);
}

export function renderEvent(
  div: HTMLDivElement,
  event: VizEvent | null | undefined,
  w: number = EDITOR_WIDTH,
  h: number = EDITOR_HEIGHT,
) {
  div.textContent = '';
  if (event !== null && event !== undefined) {
    const svg = select(div).append('svg').attr('width', w).attr('height', h);
    const canvas = svg
      .append('g')
      .attr('transform', 'scale(' + RENDERING_SCALE + ')');

    try {
      eval(event.viz_output);
    } catch (e) {
      T(canvas, 100, 100, 'INTERNAL ERROR: ', 15, 'Arial', 'red');
      T(canvas, 100, 120, '' + e, 15, 'Arial', 'red');
      T(canvas, 100, 140, '' + event.viz_output, 15, 'Arial', 'black');
    }
  }
}
