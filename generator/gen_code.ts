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

function genFactoryFunc(ts_class_name: string, constructor_arg_name: string, constructor_arg_type:string) : string{
    return `
    public static create(${constructor_arg_name}: ${constructor_arg_type}): ${ts_class_name} {
        return new ${ts_class_name}(${constructor_arg_name});
    }
`;
}

function declareClass(
    name: string,
    constructor_sig: string,
    style_assignment: string,
    member_declarations: string[],
    member_initializations: string[],
    factory_func: string | null): void {
    classes_output += `
export class ${name} {
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


if (factory_func !== null) {
    classes_output += `
${factory_func}
`
}

    classes_output += `
};
`
;

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
    if (ids_to_class_info.has(page_decl.id)) {
        throw new Error(`Already generated class for id ${page_decl.id}`);
    }

    const generated_ts_class_name = `TS_${page_decl.id}_Container`;
    const class_info = new ClassInfo(page_decl, generated_ts_class_name);
    ids_to_class_info.set(page_decl.id, class_info);
    const el_ts_class_name = tag_name_to_class.get(page_decl.tagName);

    let [members_modifier, constructor_modifier] = ["public", "public"];
    if (page_decl.owner) {
        members_modifier = "protected";
    } else {
        constructor_modifier = "private";
    }

    const arg_name = "el";
    const constructor_sig = `${constructor_modifier} constructor(${members_modifier} readonly ${arg_name}: ${el_ts_class_name})`;
    const member_declarations: string[] = [];
    const child_instantiations: string[] = [];

    const style_name = genStyle(page_decl);

    const style_assignment = `this.el.className = styles.${style_name};`;

    for (const child of page_decl.children) {
        const child_ts_class_name = genClass(child);
        const child_declaration = `${members_modifier} readonly ${child.id}: ${child_ts_class_name};`;
        member_declarations.push(child_declaration);

        const temp_child_name = `child_${child.id}`;
        const create_child = `const ${temp_child_name} = document.createElement('${child.tagName}');`;
        const assign_id = `${temp_child_name}.id = '${child.id}';`;
        const add_child_to_parent = `this.el.appendChild(${temp_child_name});`;
        const child_ts_class_name_to_use = `class_registry.${child.id}_cls`;
        let create_child_container = '';
        if (child.owner) {
            create_child_container = `this.${child.id} = new ${child_ts_class_name_to_use}(${temp_child_name});`;
        } else {
            create_child_container = `this.${child.id} = ${child_ts_class_name}.create(${temp_child_name})`;
        }
        const child_instantiation = create_child + assign_id + add_child_to_parent + create_child_container;
        child_instantiations.push(child_instantiation);
    }
    if (page_decl.owner) {
        declareClass(generated_ts_class_name,constructor_sig,style_assignment,member_declarations,child_instantiations, null);
    } else {
        const factory_func = genFactoryFunc(generated_ts_class_name,arg_name,el_ts_class_name);
        declareClass(generated_ts_class_name,constructor_sig,style_assignment,member_declarations,child_instantiations, factory_func);
    }

    return generated_ts_class_name;
}

function genClassRegistry(){
    let members = '';
    for (const [id_, class_info] of ids_to_class_info) {
        if (class_info.page_decl_obj.owner) {
            members += `public ${id_}_cls: typeof ${class_info.ts_class_name} = ${class_info.ts_class_name},`;
        }
    }

    classes_output += `
export class ClassRegistry {
    public constructor(${members}) {}
}

export const class_registry = new ClassRegistry();
`;
}

genClass(page_object);
genClassRegistry();

writeFileSync("src/generated/classes.css.ts", css_output, {flag: "w"});
writeFileSync("src/generated/classes.ts", classes_output, {flag: "w"});
