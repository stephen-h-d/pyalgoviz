import { style } from '@vanilla-extract/css';

const edge = style({position: "absolute", zIndex: 1, backgroundColor: "green"});

const horizontal_edge = style([edge, {width: "100%", height: "5px", cursor: "row-resize"}]);
const vertical_edge = style([edge, {height: "100%", width: "5px", cursor: "col-resize"}]);

export const top_resize_edge = style([horizontal_edge, {top: -5}]);
export const bottom_resize_edge = style([horizontal_edge, {bottom: -5, margin: 0, padding: 0, backgroundColor: "red"}]);

export const left_resize_edge = style([vertical_edge, {left: -5}]);
export const right_resize_edge = style([vertical_edge, {right: -5}]);

const grid_cell = style({border: "solid lightgray", position: "relative"});

export const top_left_cell = style([grid_cell, {gridRow: 1, gridColumn: 1}]);
export const bottom_left_cell = style([grid_cell, {gridRow: 2, gridColumn: 1}]);
export const top_right_cell = style([grid_cell, {gridRow: 1, gridColumn: 2}]);
export const bottom_right_cell = style([grid_cell, {gridRow: 2, gridColumn: 2}]);

export const ide = style({display: "grid"});
