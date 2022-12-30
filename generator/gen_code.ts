import {page_object, PageDeclObject} from "../src/edit_page.js";
import {tag_name_to_class} from "./mappings.js";
import { writeFileSync } from 'fs';

const ids_seen = new Set();
let classes_output = `
// THIS CODE IS AUTO-GENERATED. DO NOT MODIFY BY HAND.

`;
let css_output = classes_output;

classes_output += `import * as styles from "./classes.css";
`

css_output += `import { style } from '@vanilla-extract/css';
`

function declareClass(
    name: string,
    constructor_arg: string,
    style_assignment: string,
    member_declarations: string[],
    member_initializations: string[],): void {
    classes_output += `
export class ${name} {
`;

var joined = member_declarations.join(`
    `);
    
    classes_output += `
    ${joined}
`;
    
classes_output += `
    public constructor(${constructor_arg}) {
        ${style_assignment}`;

    var joined = member_initializations.join(`
        `);
        
        classes_output += `
        ${joined}
`;

    classes_output += `
    }
};
`;

}

function genStyle(page_decl: PageDeclObject): string {
    const style = JSON.stringify(page_decl.style);
    const style_name = `${page_decl.id}_style`;
    const css_style_initialization = `export const ${style_name} = style(${style});
`;
    css_output += css_style_initialization;
    return style_name;
}

function genClass(page_decl: PageDeclObject) {
    if (ids_seen.has(page_decl.id)) {
        throw new Error(`Already generated class for id ${page_decl.id}`);
    }

    ids_seen.add(page_decl.id);
    const generated_ts_class_name = `TS_${page_decl.id}_Container`;
    const el_ts_class_name = tag_name_to_class.get(page_decl.tagName);
    const constructor_arg = `public readonly el: ${el_ts_class_name}`;
    const member_declarations: string[] = [];
    const child_instantiations: string[] = [];

    const style_name = genStyle(page_decl);

    const style_assignment = `this.el.className = styles.${style_name}`;

    for (const child of page_decl.children) {
        const child_ts_class_name = genClass(child);
        const child_declaration = `public readonly ${child.id}: ${child_ts_class_name};`;
        member_declarations.push(child_declaration);

        const temp_child_name = `child_${child.id}`;
        const create_child = `const ${temp_child_name} = document.createElement('${child.tagName}');`;
        const assign_id = `${temp_child_name}.id = '${child.id}';`;
        const add_child_to_parent = `this.el.appendChild(${temp_child_name});`;
        const create_child_container = `this.${child.id} = new ${child_ts_class_name}(${temp_child_name});`;
        const child_instantiation = create_child + assign_id + add_child_to_parent + create_child_container;
        child_instantiations.push(child_instantiation);
    }

    declareClass(generated_ts_class_name,constructor_arg,style_assignment,member_declarations,child_instantiations);

    return generated_ts_class_name;
}

genClass(page_object);

writeFileSync("src/generated/classes.css.ts", css_output, {flag: "w"});
writeFileSync("src/generated/classes.ts", classes_output, {flag: "w"});

