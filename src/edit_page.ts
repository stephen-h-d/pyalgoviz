import { ComplexStyleRule } from '@vanilla-extract/css';
import type * as CSS from 'csstype';

type PageDecl = [string, string, ComplexStyleRule] |
                [string, string, ComplexStyleRule, boolean] |
                [string, string, ComplexStyleRule, boolean, PageDecl[]];
export interface PageDeclObject {
    tagName: string,
    id: string,
    style: ComplexStyleRule,
    owner: boolean,
    children: PageDeclObject[],
}

export const EL = 0;
export const ID = 1;
export const STYLE = 2;
export const OWNER = 3;
export const CHILDREN = 4;

function build_page_decl_object(page_decl: PageDecl): PageDeclObject {
    const result: Partial<PageDeclObject> = {};
    result["tagName"] = page_decl[EL];
    result["id"] = page_decl[ID];
    result["style"] = page_decl[STYLE];
    result["owner"] = page_decl[OWNER];
    result["children"] = [];

    if (page_decl.length > CHILDREN && page_decl[CHILDREN] !== undefined) {
        for (const child of page_decl[CHILDREN]) {
            result["children"].push(build_page_decl_object(child));
        }
    }
    return result as PageDeclObject;
}

const edge: CSS.Properties = {position: "absolute", zIndex: 2, backgroundColor: "green"};
const horizontal_edge: CSS.Properties = {...edge, width: "100%", height: "3px", cursor: "row-resize"};
const vertical_edge: CSS.Properties = {...edge, height: "100%", width: "3px", cursor: "col-resize"};
const right_edge: CSS.Properties = {...vertical_edge, right: 0, marginRight: "-3px"};
const left_edge: CSS.Properties = {...vertical_edge, left: 0, marginLeft: "-3px"};
const bottom_edge: CSS.Properties = {...horizontal_edge, bottom: 0, marginBottom: "-3px"};
const top_edge: CSS.Properties = {...horizontal_edge, top: 0, marginTop: "-3px"};

const page: PageDecl =
["div", "app", {display: "flex", flexFlow: "column", height: "100%"}, true, [
    ["div", "header", {flex: "0 1 auto"}],
    ["div", "content", {flex: "1 1 auto", backgroundColor: "turquoise"}, true, [
        ["div","ide",{display:"grid", gap:3, gridTemplateColumns: "var(--col-1-width) var(--col-2-width)", backgroundColor: "lightgoldenrodyellow", height: "100%", vars: {
            ["--row-11-height"]: "50%",
            ["--row-12-height"]: "50%",
            ["--row-21-height"]: "50%",
            ["--row-22-height"]: "50%",
            ["--col-1-width"]: "50%",
            ["--col-2-width"]: "50%",
          }},true,[
            ["div","left_col",{gridColumn: 1, display: "grid", gap:3, gridTemplateRows: "var(--row-11-height) var(--row-12-height)", position: "relative"}, false, [
                ["div", "right_edge", right_edge],
                ["div", "top_left_cell", {gridRow: 1, position: "relative"},false,[
                    ["div", "left_bottom_edge", bottom_edge],
                    ["div", "top_left_cell_contents", {height: "100%", width: "100%", display: "flex", flexFlow: "column", }, true, [
                        ["div", "algo_editor_wrapper", {position: "relative", flex: "1 1 auto"},false, [
                            ["div", "algo_editor", {height: "100%", position: "absolute", top: 0, bottom: 0, left: 0, right: 0}],
                        ]],
                        ["div", "inputs", {flex: "0 1 auto"}],
                    ]],
                ]],
                ["div", "bottom_left_cell", {gridRow: 2, position: "relative"},false,[
                    ["div", "left_top_edge", top_edge],
                    ["div", "bottom_left_cell_contents", {}, true],
                ]],
            ]],
            ["div","right_col",{gridColumn: 2, display: "grid", gap:3, gridTemplateRows: "var(--row-21-height) var(--row-22-height)", position: "relative"},false,[
                ["div", "left_edge", left_edge],
                ["div", "top_right_cell", {gridRow: 1, position: "relative"}, false, [
                    ["div", "right_bottom_edge", bottom_edge],
                    ["div", "top_right_cell_contents", {}, true],
                ]],
                ["div", "bottom_right_cell", {gridRow: 2, position: "relative"}, false, [
                    ["div", "right_top_edge", top_edge],
                    ["div", "bottom_right_cell_contents", {}, true],
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
