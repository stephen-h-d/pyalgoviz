// import type * as CSS from 'csstype';
import { build_page_decl_object, PageDecl } from '../PageDeclObject.js';

// based on https://palettes.shecodes.io/palettes/1551
export const dark = "#272343";
export const light_green = "#e3f6f5";
export const dark_green = "#bae8e8";

// const tab_style: CSS.Properties = {
//     backgroundColor: light_green,
//     borderColor: dark_green,
//     height: "1.2em",
//     borderTopLeftRadius: "10px",
//     borderTopRightRadius: "10px",
//     borderBottomRightRadius: "2px",
//     borderBottomLeftRadius: "2px",
//     flex: "0 1 auto",
//     padding: "2px",
// };

const page: PageDecl = ["div", "app", {display: "flex", flexFlow: "column", height: "100%"}, true, []];

const page_object = build_page_decl_object(page);

export const html_style = {height: "100%", margin: "0"};
export const body_style = {height: "100%", margin: "0"};

export const coloring_styles = { "root": {backgroundColor: "green"}, };

export {page, page_object};
