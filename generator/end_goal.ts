
export class Inner {
    public constructor(protected el: HTMLDivElement){}

    doInner(){}
}

export function makeInner(): [HTMLDivElement, Inner] {
    // this is the child element of outer...
    const el = document.createElement("div");
    const inner = new Inner(el);
    return [el, inner];
}

export class Outer {
    public constructor(protected el: HTMLDivElement, protected inner: Inner){}

    doOuter(){}
}

export function makeOuter(inner: Inner): [HTMLDivElement, Outer] {
    const el = document.createElement("div");
    const outer = new Outer(el, inner);
    return [el, outer];
}

export function makeAll(){
    const [innerEl, inner] = makeInner();
    const [outerEl, outer] = makeOuter(inner);
    outerEl.appendChild(innerEl);
}
