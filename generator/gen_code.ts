import {page_object, PageDeclObject} from "../src/edit_page.js";
import {tag_name_to_class} from "./mappings.js";
import { writeFileSync } from 'fs';

class ClassInfo {

    public constructor(public page_decl_obj: PageDeclObject, public ts_class_name: string,
        public generic_class_name: string){

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

let factory_funcs_output = '';

let build_classes_output = '';


let args_interface_generic_params = '';
const args_interface_generic_args_list: string[] = [];
const args_class_list: string[] = [];
const args_class_decl_list: string[] = [];


function genCreateElement(el_name: string, page_decl: PageDeclObject, style_name: string) {
    return `
    const ${el_name} = document.createElement('${page_decl.tagName}');
    ${el_name}.id = "${page_decl.id}";
    ${el_name}.className = styles.${style_name};
    `;
}

function declareClassElsClass(name:string, element_variables: string[]) {
    const constructor_sig = element_variables.join(", ");

    classes_output += `
class ${name} {
    public constructor(${constructor_sig}){

    }
}

export type { ${name} };
`;
}

function declareClass(
    export_class: string,
    name: string,
    constructor_sig: string,
    member_declarations: string[],
    member_initializations: string[],
    replace_method: string=""): void {
    classes_output += `
${export_class} class ${name} {
`;

var joined = member_declarations.join(`
    `);

    classes_output += `
    ${joined}
`;

classes_output += `
    ${constructor_sig} {`;

    var joined = member_initializations.join(`
        `);

        classes_output += `
        ${joined}
    }
`;

classes_output += `
    ${replace_method}
};
`
;

}

function genReplaceMethod(ts_element_class_name: string, el_name: string) {
    return `
    public replaceEl(el: ${ts_element_class_name}){
        el.replaceWith(this.els.${el_name});
    }
`;
}

function declareFactoryFunc(function_name: string,
    factory_func_params: string,
    el_name: string,
    create_el: string,
    ts_cls_name: string,
    factory_func_args: string,
    ts_element_class_name: string,
    ts_cls_constructor: string) {
    factory_funcs_output += `
    // function ${function_name}(${factory_func_params}): [${ts_element_class_name}, ${ts_cls_name}] {
        ${create_el}

        // return [${el_name}, new ${ts_cls_constructor}(${el_name}, ${factory_func_args})];
    // }
    `;
}

function addInstantiateClassOutput(child_name: string, cls_name: string, args: string, els_class_name: string, els_args_names: string[]){
    const els = els_args_names.join(", ");
    const els_inst_name = `${child_name}_els`;

    build_classes_output += `
    const ${els_inst_name} = new ${els_class_name}(${els});
    const ${child_name} = new ${cls_name}(${els_inst_name}, ${args});`;
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

function genClass(page_decl: PageDeclObject, include_replace:boolean=false): [string, string, string[], PageDeclObject[]] {
    if (ids_to_class_info.has(page_decl.id)) {
        throw new Error(`Already generated class for id ${page_decl.id}`);
    }

    const ts_cls_name = `TS_${page_decl.id}_Container`;
    let ts_cls_name_constructor = ts_cls_name;
    const generic_class_name = `${ts_cls_name}_T`;
    const class_info = new ClassInfo(page_decl, ts_cls_name, generic_class_name);
    ids_to_class_info.set(page_decl.id, class_info);
    const ts_element_class_name = tag_name_to_class.get(page_decl.tagName);

    let [members_modifier, constructor_modifier] = ["public", "public"];

    if (page_decl.owner) {
        members_modifier = "protected";
    }

    let ad_hoc_constructor_args = "";

    const export_class = page_decl.owner ? "export" : "";
    const member_declarations: string[] = [];
    const child_instantiations: string[] = [];

    const style_name = genStyle(page_decl);

    let factory_func_params = '';
    let factory_func_args = '';
    const children_el_names = [];
    let descendants: PageDeclObject[] = [];

    for (const child of page_decl.children) {
        const [child_ts_class_name, child_el_name, grandchildren_names, desc_names] = genClass(child);
        // constructor_sig += `, ${members_modifier} readonly ${child.id}: ${child_ts_class_name}`;
        // ad_hoc_constructor_sig += `, ${child.id}: ${child_ts_class_name}`;
        factory_func_params += `${child.id}: ${child_ts_class_name}, `;
        factory_func_args += `${child.id}, `;

        children_el_names.push(child_el_name);
        descendants.push(child);
        descendants = descendants.concat(desc_names);

        // addBuildChildOutput(child.id, child_factory_func_name, child_factory_func_args);
        addAttachChildrenOutput(child_el_name, grandchildren_names);
    }

    const el_name = `${page_decl.id}_el`;
    const create_el = genCreateElement(el_name, page_decl, style_name);
    const factory_func_name = `make_${ts_cls_name}`;

    if (page_decl.owner) {
        const element_variables: string[] = [`public readonly ${page_decl.id}: ${ts_element_class_name}`];
        const container_variables: string[] = [];
        const ad_hoc_container_variables: string[] = [];
        const element_names: string[] = [el_name];

        args_interface_generic_params += `${generic_class_name} extends ${ts_cls_name}, `;
        args_interface_generic_args_list.push(generic_class_name);
        const args_class_decl = `const ${ts_cls_name}_cls = args.${ts_cls_name}_cls || ${ts_cls_name};`;
        ts_cls_name_constructor = `${ts_cls_name}_cls`;
        args_class_decl_list.push(args_class_decl);

        for (const descendant of descendants) {
            const element_class_name = tag_name_to_class.get(descendant.tagName);
            if (descendant.owner) {
                const class_info = ids_to_class_info.get(descendant.id);
                if (class_info === undefined) {
                    throw Error(`Unable to find class info for id ${descendant.id}`);
                }

                const container_variable = `${descendant.id}: ${class_info.ts_class_name}`;
                container_variables.push(container_variable);
                const ad_hoc_container_variable = `${descendant.id}: ${class_info.generic_class_name}`;
                ad_hoc_container_variables.push(ad_hoc_container_variable);
                ad_hoc_constructor_args += `${descendant.id}, `;
            } else {
                const element_variable = `public readonly ${descendant.id}: ${element_class_name}`;
                element_variables.push(element_variable);
                const element_name = `${descendant.id}_el`;
                element_names.push(element_name);
            }
        }

        const modified_container_variables = container_variables.map((val) => `protected readonly ${val}`);

        const els_class_name = `${ts_cls_name}Elements`;

        let constructor_sig = `${constructor_modifier} constructor(${members_modifier} readonly els: ${els_class_name}, `;
        constructor_sig += modified_container_variables.join(", ");
        constructor_sig += ")";

        let ad_hoc_constructor_sig = `els: ${els_class_name}, `;
        ad_hoc_constructor_sig += ad_hoc_container_variables.join(", ");

        const args_class = `${ts_cls_name}_cls: new (${ad_hoc_constructor_sig}) => ${generic_class_name}`;
        args_class_list.push(args_class);

        let replace_method = "";
        if (include_replace) {
            replace_method = genReplaceMethod(ts_element_class_name, page_decl.id);
        }
        declareClassElsClass(els_class_name, element_variables);

        declareClass(export_class,ts_cls_name,constructor_sig,member_declarations,child_instantiations,replace_method);

        addInstantiateClassOutput(page_decl.id, `${ts_cls_name}_cls`, ad_hoc_constructor_args, els_class_name, element_names);

        descendants = [];
    }
    declareFactoryFunc(factory_func_name, factory_func_params, el_name, create_el, ts_cls_name, factory_func_args,
        ts_element_class_name, ts_cls_name_constructor);

    return [ts_cls_name, el_name, children_el_names, descendants];
}

const [_generated_ts_class_name, el_name, child_el_names, _descendants] = genClass(page_object, true);
// addBuildChildOutput(page_object.id, factory_func_name, factory_func_args);
addAttachChildrenOutput(el_name, child_el_names);

const args_members = args_class_list.join(`;
`);

const args_def = `
interface Args<${args_interface_generic_params}> {
    ${args_members}
}
`;

const args_interface_generic_args = args_interface_generic_args_list.join(",");
const args_class_decls = args_class_decl_list.join(`
`);

build_classes_output = `export function build_${page_object.id}<${args_interface_generic_params}>(args: Args<${args_interface_generic_args}>) {
${args_class_decls}
${factory_funcs_output}
${build_classes_output}

    return ${page_object.id};
}`;

classes_output += args_def + build_classes_output;

// for (const class_info of ids_to_class_info.values()){
//     if (!class_info.page_decl_obj.owner) {
//     classes_output += `
// export type { ${class_info.ts_class_name} };
//     `
//     }
// }

writeFileSync("src/generated/classes.css.ts", css_output, {flag: "w"});
writeFileSync("src/generated/classes.ts", classes_output, {flag: "w"});
