import {page_object, PageDeclObject} from "../src/edit_page.js";
import {tag_name_to_class} from "./mappings.js";
import { writeFileSync } from 'fs';

class ClassInfo {

    public constructor(public page_decl_obj: PageDeclObject, public ts_class_name: string){

    }
}

let classes_output = `
// THIS CODE IS AUTO-GENERATED. DO NOT MODIFY BY HAND.

`;
let css_output = classes_output;
const ids_to_class_info = new Map<string,ClassInfo>();

classes_output += `import * as styles from "./classes.css";
`

css_output += `import { style } from '@vanilla-extract/css';
`

let build_classes_output = `
function build_top() {


`;


function declareClass(
    export_class: string,
    name: string,
    constructor_sig: string,
    style_assignment: string,
    member_declarations: string[],
    member_initializations: string[]): void {
    classes_output += `
${export_class} class ${name} {
`;

var joined = member_declarations.join(`
    `);

    classes_output += `
    ${joined}
`;

classes_output += `
    ${constructor_sig} {
        ${style_assignment}`;

    var joined = member_initializations.join(`
        `);

        classes_output += `
        ${joined}
    }
`;

    classes_output += `
};
`
;

}

function declareFactoryFunc(function_name: string,
    factory_func_params: string,
    el_name: string,
    create_el: string,
    generated_ts_class_name: string,
    factory_func_args: string,
    ts_element_class_name: string) {
    classes_output += `
function ${function_name}(${factory_func_params}): [${ts_element_class_name}, ${generated_ts_class_name}] {
    ${create_el}

    return [${el_name}, new ${generated_ts_class_name}(${el_name}, ${factory_func_args})];
}
    `;
}

function addBuildChildOutput(child_name: string, factory_func_name: string, factory_func_args: string){
    build_classes_output += `
    const [${child_name}_el, ${child_name}] = ${factory_func_name}(${factory_func_args});`;
}

function addAttachChildrenOutput(el_name: string, children_el_names: string[]) {
    build_classes_output += "\n";

    for (const children_el_name of children_el_names) {
        build_classes_output += `
    ${el_name}.appendChild(${children_el_name});`;
    }
}

function genStyle(page_decl: PageDeclObject): string {
    const style = JSON.stringify(page_decl.style);
    const style_name = `${page_decl.id}_style`;
    const css_style_initialization = `export const ${style_name} = style(${style});
`;
    css_output += css_style_initialization;
    return style_name;
}

function genClass(page_decl: PageDeclObject): [string, string, string, string, string[]] {
    if (ids_to_class_info.has(page_decl.id)) {
        throw new Error(`Already generated class for id ${page_decl.id}`);
    }

    const generated_ts_class_name = `TS_${page_decl.id}_Container`;
    const class_info = new ClassInfo(page_decl, generated_ts_class_name);
    ids_to_class_info.set(page_decl.id, class_info);
    const ts_element_class_name = tag_name_to_class.get(page_decl.tagName);

    let [members_modifier, constructor_modifier] = ["public", "public"];
    if (page_decl.owner) {
        members_modifier = "protected";
    }

    const arg_name = "el";
    let constructor_sig = `${constructor_modifier} constructor(${members_modifier} readonly ${arg_name}: ${ts_element_class_name}`;
    const export_class = page_decl.owner ? "export" : "";
    const member_declarations: string[] = [];
    const child_instantiations: string[] = [];

    const style_name = genStyle(page_decl);

    const style_assignment = `this.el.className = styles.${style_name};`;

    let factory_func_params = '';
    let factory_func_args = '';
    const children_el_names = [];

    for (const child of page_decl.children) {
        const [child_ts_class_name, child_factory_func_name, child_factory_func_args, child_el_name, grandchildren_names] = genClass(child);
        constructor_sig += `, ${members_modifier} readonly ${child.id}: ${child_ts_class_name}`;
        factory_func_params += `${child.id}: ${child_ts_class_name}, `;
        factory_func_args += `${child.id}, `;
        children_el_names.push(child_el_name);

        addBuildChildOutput(child.id, child_factory_func_name, child_factory_func_args);
        addAttachChildrenOutput(child_el_name, grandchildren_names);
    }
    constructor_sig += ')';

    const el_name = `${page_decl.id}_el`;
    const create_el = `const ${el_name} = document.createElement('${page_decl.tagName}');`;
    const factory_func_name = `make_${generated_ts_class_name}`;

    declareClass(export_class,generated_ts_class_name,constructor_sig,style_assignment,member_declarations,child_instantiations);
    declareFactoryFunc(factory_func_name, factory_func_params, el_name, create_el, generated_ts_class_name, factory_func_args, ts_element_class_name);

    return [generated_ts_class_name, factory_func_name, factory_func_args, el_name, children_el_names];
}

const [_generated_ts_class_name, factory_func_name, factory_func_args, el_name, child_el_names] = genClass(page_object);
addBuildChildOutput(page_object.id, factory_func_name, factory_func_args);
addAttachChildrenOutput(el_name, child_el_names);

build_classes_output += `
}`;

classes_output += build_classes_output;

writeFileSync("src/generated/classes.css.ts", css_output, {flag: "w"});
writeFileSync("src/generated/classes.ts", classes_output, {flag: "w"});



// function oldgenClass(page_decl: PageDeclObject) {
//     if (ids_to_class_info.has(page_decl.id)) {
//         throw new Error(`Already generated class for id ${page_decl.id}`);
//     }

//     const generated_ts_class_name = `TS_${page_decl.id}_Container`;
//     const class_info = new ClassInfo(page_decl, generated_ts_class_name);
//     ids_to_class_info.set(page_decl.id, class_info);
//     const el_ts_class_name = tag_name_to_class.get(page_decl.tagName);

//     let [members_modifier, constructor_modifier] = ["public", "public"];
//     if (page_decl.owner) {
//         members_modifier = "protected";
//     } else {
//         constructor_modifier = "private";
//     }

//     const arg_name = "el";
//     const constructor_sig = `${constructor_modifier} constructor(${members_modifier} readonly ${arg_name}: ${el_ts_class_name})`;
//     const member_declarations: string[] = [];
//     const child_instantiations: string[] = [];

//     const style_name = genStyle(page_decl);

//     const style_assignment = `this.el.className = styles.${style_name};`;

//     for (const child of page_decl.children) {
//         const child_ts_class_name = genClass(child);
//         const child_declaration = `${members_modifier} readonly ${child.id}: ${child_ts_class_name};`;
//         member_declarations.push(child_declaration);

//         const temp_child_name = `child_${child.id}`;
//         const create_child = `const ${temp_child_name} = document.createElement('${child.tagName}');`;
//         const assign_id = `${temp_child_name}.id = '${child.id}';`;
//         const add_child_to_parent = `this.el.appendChild(${temp_child_name});`;
//         const child_ts_class_name_to_use = `class_registry.${child.id}_cls`;
//         let create_child_container = '';
//         if (child.owner) {
//             create_child_container = `this.${child.id} = new ${child_ts_class_name_to_use}(${temp_child_name});`;
//         } else {
//             create_child_container = `this.${child.id} = ${child_ts_class_name}.create(${temp_child_name})`;
//         }
//         const child_instantiation = create_child + assign_id + add_child_to_parent + create_child_container;
//         child_instantiations.push(child_instantiation);
//     }
//     if (page_decl.owner) {
//         declareClass(generated_ts_class_name,constructor_sig,style_assignment,member_declarations,child_instantiations, null);
//     } else {
//         const factory_func = genFactoryFunc(generated_ts_class_name,arg_name,el_ts_class_name);
//         declareClass(generated_ts_class_name,constructor_sig,style_assignment,member_declarations,child_instantiations, factory_func);
//     }

//     return generated_ts_class_name;
// }
