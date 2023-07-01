import { Selection, select, arc } from 'd3';
import { VizEvent } from './exec_result';
const RENDERING_SCALE = 1.0; // TODO make this more dynamic?

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
    .attr('font-size', String(size) + 'px')
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
    .attr('transform', 'translate(' + String(x) + ',' + String(y) + ')')
    .attr('fill', color);
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

// This is a hack to make these functions be used and therefore included
// in the bundler. I don't know of a less hacky way that also does not
// result in TSC / linter warnings about unused code.
console.trace(L);
console.trace(A);
console.trace(R);
console.trace(C);

export function renderEvent(
  div: HTMLDivElement,
  event: VizEvent | null | undefined,
  // the bounding box to use for the viewbox; if undefined, just use the bounding box of the canvas.
  // This is necessary to make the view consistent across the different viz outputs (see getBBox)
  bBox?: DOMRect,
): DOMRect {
  // TODO make a version of this that just renders to a hidden element
  // and then calculates the maximum canvas box

  div.textContent = '';
  if (event !== null && event !== undefined) {
    const svg = select(div).append('svg');
    const canvas = svg
      .append('g')
      .attr('transform', 'scale(' + String(RENDERING_SCALE) + ')');

    try {
      eval(event.viz_output);
    } catch (e) {
      console.error(e);
      T(canvas, 100, 100, 'INTERNAL ERROR: ', 15, 'Arial', 'red');
      T(canvas, 100, 120, '' + String(e), 15, 'Arial', 'red');
      T(canvas, 100, 140, '' + event.viz_output, 15, 'Arial', 'black');
      return new DOMRect(0, 0, 500, 500);
    }

    const node = canvas.node();
    if (node === undefined || node === null) {
      return new DOMRect(0, 0, 500, 500);
    }

    svg.attr('width', '500').attr('height', '500');

    const canvasBox = node.getBBox();

    if (bBox === undefined) {
      const viewbox = `${canvasBox.x - 50} ${canvasBox.y - 50} ${
        canvasBox.width + 100
      } ${canvasBox.height + 100}`;

      svg.attr('viewBox', viewbox);
    } else {
      const viewbox = `${bBox.x - 50} ${bBox.y - 50} ${bBox.width + 100} ${
        bBox.height + 100
      }`;

      svg.attr('viewBox', viewbox);
    }

    return canvasBox;
  }
  return new DOMRect(0, 0, 500, 500);
}

// Returns the bounding box for all of these events
export function getBBox(events: (VizEvent | null | undefined)[]) {
  // Render all of the events and find the biggest box
  const div = document.createElement('div');
  div.style.opacity = '0';
  document.body.appendChild(div);
  const bBoxes = [];
  for (const event of events) {
    bBoxes.push(renderEvent(div, event));
  }
  return encompassingBoundingBox(bBoxes);
}
