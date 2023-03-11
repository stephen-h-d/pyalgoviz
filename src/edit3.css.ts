import { globalStyle, style } from '@vanilla-extract/css';

export const app = style({display: "flex", flexFlow: "column", height: "100%"});

export const header = style({flex: "0 1 auto"});
export const content = style({flex: "1 1 auto"});
export const footer = style({flex: "0 1 auto"});

export const ide = style({display:"grid", gap:1, gridTemplateColumns: "var(--col-1-width) var(--col-2-width)", height: "100%"});

export const left_col = style({gridColumn: 1, display: "grid", gap:1, gridTemplateRows: "var(--cell-11-height) var(--cell-12-height)", position: "relative"});
export const right_col = style({gridColumn: 2, display: "grid", gap:1, gridTemplateRows: "var(--cell-21-height) var(--cell-22-height)", position: "relative"});

export const top_left_cell = style({gridRow: 1, position: "relative"});
export const bottom_left_cell = style({gridRow: 2, position: "relative"});
export const top_right_cell = style({gridRow: 1, position: "relative", overflow: "scroll"});
export const bottom_right_cell = style({gridRow: 2, position: "relative"});

// based on https://palettes.shecodes.io/palettes/1551
export const dark = "#272343";
export const light_green = "#e3f6f5";
export const dark_green = "#bae8e8";
export const edge = style({position: "absolute", zIndex: 2, backgroundColor: dark, backgroundClip: "padding-box"});
export const horizontal_edge = style([edge, {width: "100%", height: "1px", cursor: "row-resize", borderTop: "5px solid rgba(0,0,0,0)", borderBottom: "5px solid rgba(0,0,0,0)", }]);
export const vertical_edge = style([edge, {height: "100%", width: "1px", cursor: "col-resize", borderLeft: "5px solid rgba(0,0,0,0)", borderRight: "5px solid rgba(0,0,0,0)", }]);
export const right_edge = style([vertical_edge, {right: 0, marginRight: "-6px"}]);
export const left_edge = style([vertical_edge, {left: 0, marginLeft: "-6px"}]);
export const bottom_edge = style([horizontal_edge, {bottom: 0, marginBottom: "-6px"}]);
export const top_edge = style([horizontal_edge, {top: 0, marginTop: "-6px"}]);

export const top_left_contents = style({height: "100%", width: "100%", display: "flex", flexFlow: "column", });
export const bottom_left_contents = style({height: "100%", width: "100%", display: "flex", flexFlow: "column", });
export const top_right_contents = style({});
export const bottom_right_contents = style({height: "100%", width: "100%", display: "flex", flexFlow: "column"});

const global_args = { height: "100%", margin: "0" };
export const global = style(global_args);
globalStyle('html, body', global_args);
