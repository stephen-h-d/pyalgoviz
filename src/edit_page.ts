import type * as CSS from 'csstype';

type PageDecl = [string, string, CSS.Properties, PageDecl[]];
export interface PageDeclObject {
    el: string,
    id: string,
    style: CSS.Properties,
    children: PageDeclObject[],
}

export const EL = 0;
export const ID = 1;
export const STYLE = 2;
export const CHILDREN = 3;

function build_page_decl_object(page_decl: PageDecl): PageDeclObject {
    const result: Partial<PageDeclObject> = {};
    result["el"] = page_decl[EL];
    result["id"] = page_decl[ID];
    result["style"] = page_decl[STYLE];
    result["children"] = [];

    for (const child of page_decl[CHILDREN]) {
        result["children"].push(build_page_decl_object(child));
    }
    return result as PageDeclObject;
}

// export const page: PageDecl = [
//     ["div", "root", ({position: "absolute"}), [
//         ["div", "child_one", ({position: "relative"})],
//         ["div", "child_two", "child_two_style"],
//         ["div", "child_three",
//             ({position: "absolute"}),
//             [
//                 ["div", "grandchild", "grandchild_style"]
//         ]],
//     ]]
// ];

const page: PageDecl =
["div", "root", {display: "flex", flexFlow: "column"}, [
    ["div", "header", {flex: "0 1 auto"}, []],
    ["div", "content", {flex: "1 1 auto"}, [
        // TODO make this a var one or the other
        ["div","ide",{display:"grid", gridTemplateColumns: "25% 75%"},[
            // TODO determine if this is doable or if another child is needed
            ["div","left_col",{gridColumn: 1, display: "grid", gridTemplateRows: "70% 30%"},[
                ["div", "top_left_cell", {gridRow: 1},[]],
                ["div", "bottom_left_cell", {gridRow: 2},[]],
            ]],
            ["div","right_col",{gridColumn: 2},[
                ["div", "top_right_cell", {gridRow: 1},[]],
                ["div", "bottom_right_cell", {gridRow: 2},[]],
            ]],
        ]],
    ]],
    ["div", "footer", {flex: "0 1 40px"}, []],
]];

page[STYLE]["backgroundColor"] = "lightblue";

const page_object = build_page_decl_object(page);

export const html_style = {height: "100%", margin: "0"};
export const body_style = {height: "100%", margin: "0"};

export const coloring_styles = {
  "root": {backgroundColor: "green"},
};

export {page, page_object};
