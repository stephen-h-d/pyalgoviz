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
  boundingBoxes: DOMRect[],
) {
  const newText = canvas
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .text(txt)
    .attr('font-size', String(size) + 'px')
    .attr('font-family', font)
    .attr('fill', color);

  const newEl = newText.node();
  if (newEl !== null) {
    boundingBoxes.push(newEl.getBBox());
  }
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
  boundingBoxes: DOMRect[],
) {
  const newLine = canvas
    .append('line')
    .attr('x1', x1)
    .attr('y1', y1)
    .attr('x2', x2)
    .attr('y2', y2)
    .attr('stroke', color)
    .attr('stroke-width', width);

  const newEl = newLine.node();
  if (newEl !== null) {
    boundingBoxes.push(newEl.getBBox());
  }
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
  boundingBoxes: DOMRect[],
) {
  const newRect = canvas
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', w)
    .attr('height', h)
    .attr('fill', fill)
    .attr('stroke', border);

  const newEl = newRect.node();
  if (newEl !== null) {
    boundingBoxes.push(newEl.getBBox());
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function C(
  canvas: Selection<SVGGElement, unknown, null, undefined>,
  x: number,
  y: number,
  r: number,
  fill: string,
  border: string,
  boundingBoxes: DOMRect[],
) {
  const newCircle = canvas
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', r)
    .attr('fill', fill)
    .attr('stroke', border);

  const newEl = newCircle.node();
  if (newEl !== null) {
    boundingBoxes.push(newEl.getBBox());
  }
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
  boundingBoxes: DOMRect[],
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
  const newArc = canvas
    .append('path')
    .attr('d', arcToAdd(arcData))
    .attr('transform', 'translate(' + String(x) + ',' + String(y) + ')')
    .attr('fill', color);

  const newEl = newArc.node();
  if (newEl !== null) {
    boundingBoxes.push(newEl.getBBox());
  }
}

function encompassingBoundingBox(rects: DOMRect[]): DOMRect {
  if (!rects || rects.length === 0) {
    // probably better to just use a 500x500 blank box than a 0x0 box or null
    return new DOMRect(0, 0, 500, 500);
  }

  let minX = rects[0].x;
  let minY = rects[0].y;
  let maxX = rects[0].x + rects[0].width;
  let maxY = rects[0].y + rects[0].height;

  for (let i = 1; i < rects.length; i++) {
    minX = Math.min(minX, rects[i].x);
    minY = Math.min(minY, rects[i].y);
    maxX = Math.max(maxX, rects[i].x + rects[i].width);
    maxY = Math.max(maxY, rects[i].y + rects[i].height);
  }

  const result: DOMRect = new DOMRect(minX, minY, maxX - minX, maxY - minY);

  return result;
}

export function renderEvent(
  div: HTMLDivElement,
  event: VizEvent | null | undefined,
) {
  // TODO add this CSS for at least the demo part: {
  //   width: auto;
  //   height: auto;
  // }

  div.textContent = '';
  if (event !== null && event !== undefined) {
    const svg = select(div).append('svg');
    const canvas = svg
      .append('g')
      .attr('transform', 'scale(' + String(RENDERING_SCALE) + ')');
    const boundingBoxes: DOMRect[] = [];

    try {
      console.log(event.viz_output);
      eval(`
      boundingBoxes.push(new DOMRect(0, 0, 500, 500));
      `);
      // eval(event.viz_output);
    } catch (e) {
      console.error(e);
      T(canvas, 100, 100, 'INTERNAL ERROR: ', 15, 'Arial', 'red');
      T(canvas, 100, 120, '' + String(e), 15, 'Arial', 'red');
      T(canvas, 100, 140, '' + event.viz_output, 15, 'Arial', 'black');
    }

    const box = encompassingBoundingBox(boundingBoxes);

    svg.attr('width', box.width).attr('height', box.height);
  }
}
