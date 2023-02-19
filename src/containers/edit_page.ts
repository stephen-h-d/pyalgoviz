import type * as CSS from 'csstype';
import { build_page_decl_object, PageDecl } from '../PageDeclObject.js';

// based on https://palettes.shecodes.io/palettes/1551
export const dark = "#272343";
export const light_green = "#e3f6f5";
export const dark_green = "#bae8e8";

const edge: CSS.Properties = {position: "absolute", zIndex: 2, backgroundColor: dark, backgroundClip: "padding-box"};
const horizontal_edge: CSS.Properties = {...edge, width: "100%", height: "1px", cursor: "row-resize", borderTop: "5px solid rgba(0,0,0,0)", borderBottom: "5px solid rgba(0,0,0,0)", };
const vertical_edge: CSS.Properties = {...edge, height: "100%", width: "1px", cursor: "col-resize", borderLeft: "5px solid rgba(0,0,0,0)", borderRight: "5px solid rgba(0,0,0,0)", };
const right_edge: CSS.Properties = {...vertical_edge, right: 0, marginRight: "-6px"};
const left_edge: CSS.Properties = {...vertical_edge, left: 0, marginLeft: "-6px"};
const bottom_edge: CSS.Properties = {...horizontal_edge, bottom: 0, marginBottom: "-6px"};
const top_edge: CSS.Properties = {...horizontal_edge, top: 0, marginTop: "-6px"};

const input_style = {margin: 3};

const inputs: PageDecl[] = [
    ["select", "speed", input_style, false, [
        ["option","very_fast",{}],
        ["option","fast",{}],
        ["option","medium",{}],
        ["option","slow",{}],
        ["option","very_slow",{}],
        ["option","extra_slow",{}],
    ]],
    ["button","save",input_style],
    ["button","run",input_style],
    ["button","play",input_style],
    ["button","prev",input_style],
    ["button","next",input_style],
    ["input","slider",input_style],
];

const tab_style: CSS.Properties = {
    backgroundColor: light_green,
    borderColor: dark_green,
    height: "1.2em",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
    borderBottomRightRadius: "2px",
    borderBottomLeftRadius: "2px",
    flex: "0 1 auto",
    padding: "2px",
};

const editor_style: CSS.Properties = { height: "100%", position: "absolute", top: 0, bottom: 0, left: 0, right: 0 };

const page: PageDecl =
["div", "app", {display: "flex", flexFlow: "column", height: "100%"}, true, [
    ["div", "header", {flex: "0 1 auto"}],
    ["div", "content", {flex: "1 1 auto"}, true, [
        ["div","ide",{display:"grid", gap:1, gridTemplateColumns: "var(--col-1-width) var(--col-2-width)", height: "100%", vars: {
            ["--row-11-height"]: "40%",
            ["--row-12-height"]: "60%",
            ["--row-21-height"]: "70%",
            ["--row-22-height"]: "30%",
            ["--col-1-width"]: "50%",
            ["--col-2-width"]: "50%",
          }},true,[
            ["div","left_col",{gridColumn: 1, display: "grid", gap:1, gridTemplateRows: "var(--row-11-height) var(--row-12-height)", position: "relative"}, false, [
                ["div", "right_edge", right_edge],
                ["div", "top_left_cell", {gridRow: 1, position: "relative"},false,[
                    ["div", "left_bottom_edge", bottom_edge],
                    ["div", "top_left_cell_contents", {height: "100%", width: "100%", display: "flex", flexFlow: "column", }, false, [
                        ["div", "algo_editor_wrapper", {position: "relative", flex: "1 1 auto"},true, [
                            ["div", "algo_editor", editor_style],
                        ]],
                        ["div", "inputs", {flex: "0 1 auto"}, true, inputs],
                    ]],
                ]],
                ["div", "bottom_left_cell", {gridRow: 2, position: "relative"},false,[
                    ["div", "left_top_edge", top_edge],
                    ["div", "bottom_left_cell_contents", {height: "100%", width: "100%", display: "flex", flexFlow: "column", }, false, [
                        ["div", "viz_editor_wrapper", {position: "relative", flex: "1 1 auto"},true, [
                            ["div", "viz_editor", editor_style],
                        ]],
                    ]],
                ]],
            ]],
            ["div","right_col",{gridColumn: 2, display: "grid", gap:1, gridTemplateRows: "var(--row-21-height) var(--row-22-height)", position: "relative"},false,[
                ["div", "left_edge", left_edge],
                ["div", "top_right_cell", {gridRow: 1, position: "relative", overflow: "scroll"}, false, [
                    ["div", "right_bottom_edge", bottom_edge],
                    ["div", "top_right_cell_contents", {}, true],
                ]],
                ["div", "bottom_right_cell", {gridRow: 2, position: "relative"}, false, [
                    ["div", "right_top_edge", top_edge],
                    ["div", "bottom_right_cell_contents", {height: "100%", width: "100%", display: "flex", flexFlow: "column"}, true,[
                        ["div", "tabs", {display: "flex", flexFlow: "row", flex: "0 1 auto"}, false, [
                            ["div", "algo_output_tab", tab_style],
                            ["div", "viz_output_tab", tab_style],
                        ],],
                        ["div", "tab_content", {flex: "1 1 auto", position: "relative"}, false, [
                            ["div", "algo_output", editor_style],
                            ["div", "viz_output", editor_style],
                        ],]
                    ],],
                ]],
            ]],
        ]],
    ]],
    ["div", "footer", {flex: "0 1 40px"}],
]];

const page_object = build_page_decl_object(page);

export const html_style = {height: "100%", margin: "0"};
export const body_style = {height: "100%", margin: "0"};

export const coloring_styles = {
  "root": {backgroundColor: "green"},
};

export {page, page_object};
