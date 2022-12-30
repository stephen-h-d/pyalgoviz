import { ComplexStyleRule } from '@vanilla-extract/css';
import type * as CSS from 'csstype';

type PageDecl = [string, string, ComplexStyleRule, PageDecl[]];
export interface PageDeclObject {
    tagName: string,
    id: string,
    style: ComplexStyleRule,
    children: PageDeclObject[],
}

export const EL = 0;
export const ID = 1;
export const STYLE = 2;
export const CHILDREN = 3;

function build_page_decl_object(page_decl: PageDecl): PageDeclObject {
    const result: Partial<PageDeclObject> = {};
    result["tagName"] = page_decl[EL];
    result["id"] = page_decl[ID];
    result["style"] = page_decl[STYLE];
    result["children"] = [];

    for (const child of page_decl[CHILDREN]) {
        result["children"].push(build_page_decl_object(child));
    }
    return result as PageDeclObject;
}

const edge: CSS.Properties = {position: "absolute", zIndex: 2, backgroundColor: "green"};
const horizontal_edge: CSS.Properties = {...edge, width: "100%", height: "5px", cursor: "row-resize"};
const vertical_edge: CSS.Properties = {...edge, height: "100%", width: "5px", cursor: "col-resize"};
const right_edge: CSS.Properties = {...vertical_edge, right: 0};
const left_edge: CSS.Properties = {...vertical_edge, left: 0};
const bottom_edge: CSS.Properties = {...horizontal_edge, bottom: 0};
const top_edge: CSS.Properties = {...horizontal_edge, top: 0};

const page: PageDecl =
["div", "app", {display: "flex", flexFlow: "column", height: "100%"}, [
    ["div", "header", {flex: "0 1 auto"}, []],
    ["div", "content", {flex: "1 1 auto", backgroundColor: "turquoise"}, [
        ["div","ide",{display:"grid", gridTemplateColumns: "var(--col-1-width) var(--col-2-width)", backgroundColor: "lightgoldenrodyellow", height: "100%", vars: {
            ["--row-11-height"]: "50%",
            ["--row-12-height"]: "50%",
            ["--row-21-height"]: "50%",
            ["--row-22-height"]: "50%",
            ["--col-1-width"]: "50%",
            ["--col-2-width"]: "50%",
          }},[
            ["div","left_col",{gridColumn: 1, display: "grid", gridTemplateRows: "var(--row-11-height) var(--row-12-height)", position: "relative"},[
                ["div", "right_edge", right_edge, []],
                ["div", "top_left_cell", {gridRow: 1, position: "relative"},[
                    ["div", "left_bottom_edge", bottom_edge, []],
                ]],
                ["div", "bottom_left_cell", {gridRow: 2, position: "relative"},[
                    ["div", "left_top_edge", top_edge, []],
                ]],
            ]],
            ["div","right_col",{gridColumn: 2, display: "grid", gridTemplateRows: "var(--row-21-height) var(--row-22-height)", position: "relative"},[
                ["div", "left_edge", left_edge, []],
                ["div", "top_right_cell", {gridRow: 1, position: "relative"},[
                    ["div", "right_bottom_edge", bottom_edge, []],
                ]],
                ["div", "bottom_right_cell", {gridRow: 2, position: "relative"},[
                    ["div", "right_top_edge", top_edge, []],
                ]],
            ]],
        ]],
    ]],
    ["div", "footer", {flex: "0 1 40px"}, []],
]];

// page[STYLE]["backgroundColor"] = "lightblue";

const page_object = build_page_decl_object(page);

export const html_style = {height: "100%", margin: "0"};
export const body_style = {height: "100%", margin: "0"};

export const coloring_styles = {
  "root": {backgroundColor: "green"},
};

export {page, page_object};
