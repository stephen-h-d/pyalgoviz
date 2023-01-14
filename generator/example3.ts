
class Inner {
    public constructor(protected el: number){}

    doInner(){}
}

class Outer<InnerT extends Inner> {
    public constructor(protected inner: InnerT){}

    doOuter(){}
}


class MyInner extends Inner {
    public constructor(el: number){
        super(el);
    }

    public foo(){}
}

class MyOuter extends Outer<MyInner> {
    protected inner: MyInner;

    public constructor(inner: MyInner){
        super(inner);
        this.inner = inner;
        this.inner.foo();
    }
}
