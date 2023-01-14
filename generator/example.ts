
class Inner {
    public constructor(protected el: number){}
}

class Outer {
    public constructor(protected inner: Inner){}
}



interface Args{
    make_outer?: typeof Outer;
    make_inner?: typeof Inner;
}


export function makeThem(args: Args){
 const make_outer = args.make_outer !== undefined ? args.make_outer : Outer;
 const make_inner = args.make_inner !== undefined ? args.make_inner : Inner;

 const inner = new make_inner(23);
 new make_outer(inner);
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

// makeThem({make_outer: MyOuter, }); // this fails but is not caught by TS

class Factory {
    makeInnerArgs(): [number] {
        return [23];
    }

    makeInner() : [number, Inner]{
        const el = 36;
        return [el, new Inner(el)];
    }

    makeOuter(): Outer {
        return new Outer(...this.makeInner());
    }
}

class MyFactory extends Factory {

    makeInner() : [number, MyInner]{
        return [38, new MyInner(...this.makeInnerArgs())];
    }

    makeOuter(): Outer {
        return new MyOuter(...this.makeInner());
    }
}
