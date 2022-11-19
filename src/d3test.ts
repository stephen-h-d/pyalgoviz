import {select, svg, arc} from "d3";

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

// async function A(canvas: any, x,y,r1,r2,start,end,color) {
//     const mySvg = await svg();
//     canvas.append('path')
//         .attr('d',
//         mySvg.arc()
//                 .innerRadius(r1)
//                 .outerRadius(r2)
//                 .startAngle(start)
//                 .endAngle(end)
//         )
//         .attr('transform', "translate("+x+','+y+")")
//         .attr('fill', color);
// }


async function A(canvas, x,y,r1,r2,start,end,color) {
    const mySvg = await svg();
    // debugger;
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

let theSvg = select('#render_area')
.append("svg")
.attr("width", 600)
.attr("height", 600)

let canvas = theSvg.append('g')
.attr("transform", "scale("+1.0+")");

A(canvas,50,50,3,5,34,78,"red");
