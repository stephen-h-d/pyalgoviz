import {edit_page_vanilla_decl, VanillaPageDecl} from "./edit_page.css";
// NOTE: This is necessary to get Vite to reload based on changes to edit_page.ts.
// (It doesn't propagate from `edit_page.css.ts`.)
// I don't know if there's another way other than `console.log`-ing the object.
import {page_object} from "./edit_page";
console.log(page_object);


// Begin HMR Setup
// I am not 100% sure if this section is necessary to make HMR work,
// but it seems to ensure that it does.  The setup() function essentially
// recreates the entire page every time this module is reloaded.
// The only thing it doesn't do is reload
// pyodide.  That is what is handy about it for us, since we don't often
// need to reload pyodide, and it takes a while.
function reloadModule(newModule: any) {
    console.log("newModule: ", newModule, "reloading entire page");
}

if (import.meta.hot) {
  import.meta.hot.accept(reloadModule)
}
// End HMR Setup.

function setupEl(page_decl: VanillaPageDecl) : HTMLElement{
    const el = document.createElement(page_decl.el);

    el.textContent = "";
    el.className = page_decl.style;

    for (const child of page_decl.children) {
        el.appendChild(setupEl(child));
    }
    return el;
}

function setupTopEl(page_decl: VanillaPageDecl) : HTMLElement{
    const el = document.getElementById(page_decl.id);
    if (el === null) {
      throw new Error("Setting up top element failed.");
    }

    el.textContent = "";
    el.className = page_decl.style;

    for (const child of page_decl.children) {
        el.appendChild(setupEl(child));
    }
    return el;
}

function setup() {
    // @ts-ignore
    const _top_el = setupTopEl(edit_page_vanilla_decl);
}

setup();
