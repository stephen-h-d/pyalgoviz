import { style } from '@vanilla-extract/css';
import type * as CSS from 'csstype';
import {PageDeclObject, page_object} from "./edit_page";

export interface VanillaPageDecl {
    id: string,
    el: string,
    style: string,
    children: VanillaPageDecl[],
}

function build_vanilla_page_decl(page_object: PageDeclObject): VanillaPageDecl {
    // const result: Partial<VanillaPageDecl> = {};
    const result: VanillaPageDecl = JSON.parse(JSON.stringify(page_object));
    result.style = style(result.style as CSS.Properties);
    for (const child of result.children) {
        build_vanilla_page_decl(child as PageDeclObject);
    }
    return result;
}

export const edit_page_vanilla_decl = build_vanilla_page_decl(page_object);
