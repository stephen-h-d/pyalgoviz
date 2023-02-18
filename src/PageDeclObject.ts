import { ComplexStyleRule } from '@vanilla-extract/css';

export interface PageDeclObject {
    tagName: string;
    id: string;
    style: ComplexStyleRule;
    owner: boolean;
    children: PageDeclObject[];
}

export type PageDecl = [string, string, ComplexStyleRule] |
                [string, string, ComplexStyleRule, boolean] |
                [string, string, ComplexStyleRule, boolean, PageDecl[]];

export const EL = 0;
export const ID = 1;
export const STYLE = 2;
export const OWNER = 3;
export const CHILDREN = 4;

export function build_page_decl_object(page_decl: PageDecl): PageDeclObject {
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
