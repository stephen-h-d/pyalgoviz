import { createVar, style } from '@vanilla-extract/css';

const edge = style({position: "absolute", zIndex: 2, backgroundColor: "green"});

const horizontal_edge = style([edge, {width: "100%", height: "5px", cursor: "row-resize"}]);
const vertical_edge = style([edge, {height: "100%", width: "5px", cursor: "col-resize"}]);

export const firstRowHeight = createVar();
export const secondRowHeight = createVar();

export const top_resize_edge = style([horizontal_edge, {top: 0}]);
export const bottom_resize_edge = style([horizontal_edge, {bottom: 0, backgroundColor: "red"}]);

export const left_resize_edge = style([vertical_edge, {left: 0}]);
export const right_resize_edge = style([vertical_edge, {right: 0}]);

const grid_cell = style({border: "solid lightgray", position: "relative", height: "100%", width: "100%"});

export const top_left_cell = style([grid_cell, {gridRow: 1, gridColumn: 1, display: "flex", flexDirection: "column"}]);
export const bottom_left_cell = style([grid_cell, {gridRow: 2, gridColumn: 1}]);
export const top_right_cell = style([grid_cell, {gridRow: 1, gridColumn: 2}]);
export const bottom_right_cell = style([grid_cell, {gridRow: 2, gridColumn: 2}]);

export const ide = style({display: "grid", flexGrow: 1,
    gridTemplateColumns: `${firstRowHeight} ${secondRowHeight}`,     vars: {
      [firstRowHeight]: '50%',
      [secondRowHeight]: '50%',
    },});


export const page = [

];

export const scriptEditor = style({position: "absolute", top: 0, bottom: 0, left: 0, right: 0});
export const scriptEditorWrapper = style({flexGrow: 1});
export const runInputs = style({height: "2.5em", zIndex: 1});

export const body = style({width: "100%", backgroundColor: "blue", display: "flex", flexDirection: "column", height:"100vh"});

export const root = style({
    display: "flex",
    height:"100vh",
    vars: {
      ["--row-11-height"]: "50%",
    }
  });0
