
class Inner {
    public constructor(protected el: number){}

    doInner(){}
}

class Outer {
    public constructor(protected inner: Inner){}

    doOuter(){}
}


interface Args<I extends Inner,O extends Outer,>{
    oc: new (i: I) => O;
    ic: new (el: number) => I;
}


export function makeThem<I extends Inner,O extends Outer>(args: Args<I,O>){
 const inner = new args.ic(23);
 new args.oc(inner);
}


class MyInner extends Inner {
    public constructor(el: number){
        super(el);
    }

    public foo(){}
}

class MyOuter extends Outer {
    protected inner: MyInner;

    public constructor(inner: MyInner){
        super(inner);
        this.inner = inner;
        this.inner.foo();
    }
}

makeThem({oc: Outer, ic: Inner});
makeThem({oc: Outer, ic: MyInner});
makeThem({oc: MyOuter, ic: Inner}); // TS fails this correctly
