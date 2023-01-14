// export class TS_very_fast_Container {



//     private constructor(public readonly el: HTMLOptionElement) {


//     }


//     public static create(el: HTMLOptionElement): TS_very_fast_Container {
//         return new TS_very_fast_Container(el);
//     }


// };

// export class TS_fast_Container {



//     private constructor(public readonly el: HTMLOptionElement) {


//     }


//     public static create(el: HTMLOptionElement): TS_fast_Container {
//         return new TS_fast_Container(el);
//     }


// };

// export class TS_medium_Container {



//     private constructor(public readonly el: HTMLOptionElement) {


//     }


//     public static create(el: HTMLOptionElement): TS_medium_Container {
//         return new TS_medium_Container(el);
//     }


// };

// export class TS_slow_Container {



//     private constructor(public readonly el: HTMLOptionElement) {


//     }


//     public static create(el: HTMLOptionElement): TS_slow_Container {
//         return new TS_slow_Container(el);
//     }


// };

// export class TS_very_slow_Container {



//     private constructor(public readonly el: HTMLOptionElement) {


//     }


//     public static create(el: HTMLOptionElement): TS_very_slow_Container {
//         return new TS_very_slow_Container(el);
//     }


// };

// export class TS_speed_Container {

//     public readonly very_fast: TS_very_fast_Container;
//     public readonly fast: TS_fast_Container;
//     public readonly medium: TS_medium_Container;
//     public readonly slow: TS_slow_Container;
//     public readonly very_slow: TS_very_slow_Container;

//     private constructor(public readonly el: HTMLSelectElement) {

//         const child_very_fast = document.createElement('option');child_very_fast.id = 'very_fast';this.el.appendChild(child_very_fast);this.very_fast = TS_very_fast_Container.create(child_very_fast)
//         const child_fast = document.createElement('option');child_fast.id = 'fast';this.el.appendChild(child_fast);this.fast = TS_fast_Container.create(child_fast)
//         const child_medium = document.createElement('option');child_medium.id = 'medium';this.el.appendChild(child_medium);this.medium = TS_medium_Container.create(child_medium)
//         const child_slow = document.createElement('option');child_slow.id = 'slow';this.el.appendChild(child_slow);this.slow = TS_slow_Container.create(child_slow)
//         const child_very_slow = document.createElement('option');child_very_slow.id = 'very_slow';this.el.appendChild(child_very_slow);this.very_slow = TS_very_slow_Container.create(child_very_slow)
//     }


//     public static create(el: HTMLSelectElement): TS_speed_Container {
//         return new TS_speed_Container(el);
//     }


// };

// export class TS_save_Container {



//     private constructor(public readonly el: HTMLButtonElement) {


//     }


//     public static create(el: HTMLButtonElement): TS_save_Container {
//         return new TS_save_Container(el);
//     }


// };

// export class TS_run_Container {



//     private constructor(public readonly el: HTMLButtonElement) {


//     }


//     public static create(el: HTMLButtonElement): TS_run_Container {
//         return new TS_run_Container(el);
//     }


// };

// export class TS_play_Container {



//     private constructor(public readonly el: HTMLButtonElement) {


//     }


//     public static create(el: HTMLButtonElement): TS_play_Container {
//         return new TS_play_Container(el);
//     }


// };

// export class TS_prev_Container {



//     private constructor(public readonly el: HTMLButtonElement) {


//     }


//     public static create(el: HTMLButtonElement): TS_prev_Container {
//         return new TS_prev_Container(el);
//     }


// };

// export class TS_next_Container {



//     private constructor(public readonly el: HTMLButtonElement) {


//     }


//     public static create(el: HTMLButtonElement): TS_next_Container {
//         return new TS_next_Container(el);
//     }


// };

// export class TS_inputs_Container {

//     protected readonly speed: TS_speed_Container;
//     protected readonly save: TS_save_Container;
//     protected readonly run: TS_run_Container;
//     protected readonly play: TS_play_Container;
//     protected readonly prev: TS_prev_Container;
//     protected readonly next: TS_next_Container;

//     public constructor(protected readonly el: HTMLDivElement) {

//         const child_speed = document.createElement('select');child_speed.id = 'speed';this.el.appendChild(child_speed);this.speed = TS_speed_Container.create(child_speed)
//         const child_save = document.createElement('button');child_save.id = 'save';this.el.appendChild(child_save);this.save = TS_save_Container.create(child_save)
//         const child_run = document.createElement('button');child_run.id = 'run';this.el.appendChild(child_run);this.run = TS_run_Container.create(child_run)
//         const child_play = document.createElement('button');child_play.id = 'play';this.el.appendChild(child_play);this.play = TS_play_Container.create(child_play)
//         const child_prev = document.createElement('button');child_prev.id = 'prev';this.el.appendChild(child_prev);this.prev = TS_prev_Container.create(child_prev)
//         const child_next = document.createElement('button');child_next.id = 'next';this.el.appendChild(child_next);this.next = TS_next_Container.create(child_next)
//     }

// };



// // export abstract class TS_top_left_cell_contents_Container<InputsType extends TS_inputs_Container> {

// //     protected readonly inputs: InputsType;

// //     protected abstract makeInputs(): typeof InputsType; // this doesn't work because generic types don't exist at runtime...

// //     public constructor(protected readonly el: HTMLDivElement) {
// //         const child_algo_editor_wrapper = document.createElement('div');child_algo_editor_wrapper.id = 'algo_editor_wrapper';this.el.appendChild(child_algo_editor_wrapper);this.algo_editor_wrapper = TS_algo_editor_wrapper_Container.create(child_algo_editor_wrapper)
// //         const child_inputs = document.createElement('div');child_inputs.id = 'inputs';this.el.appendChild(child_inputs);
// //         this.inputs = new (this.makeInputs())(child_inputs);
// //     }

// // };

// export class TS_top_left_cell_contents_Container {

//     protected readonly inputs: TS_inputs_Container;

//     public constructor(protected readonly el: HTMLDivElement) {
//         const child_algo_editor_wrapper = document.createElement('div');child_algo_editor_wrapper.id = 'algo_editor_wrapper';this.el.appendChild(child_algo_editor_wrapper);this.algo_editor_wrapper = TS_algo_editor_wrapper_Container.create(child_algo_editor_wrapper)
//         const child_inputs = document.createElement('div');child_inputs.id = 'inputs';this.el.appendChild(child_inputs);this.inputs = new TS_inputs_Container(child_inputs);
//     }
// };



// class Inputs extends TS_inputs_Container {


//     public constructor(orig: TS_inputs_Container) {
//       super(el);
//       this.speed.very_fast.el.textContent = "Very Fast";
//       this.speed.fast.el.textContent = "Fast";
//       this.speed.medium.el.textContent = "Medium";
//       this.speed.slow.el.textContent = "Slow";
//       this.speed.very_slow.el.textContent = "Very Slow";
//       this.speed.el.selectedIndex = 2;

//       this.save.el.textContent = "Save";
//       this.run.el.textContent = "Run";
//       this.prev.el.textContent = "Previous";
//       this.next.el.textContent = "Next";
//       this.play.el.textContent = "Play";


//       for (const input of [this.speed,this.save,this.run,this.prev,this.next,this.play]){
//         input.el.disabled = true;
//       }
//     }

//   }


// class IDE extends TS_top_left_cell_contents_Container  {

//     protected readonly my_inputs: Inputs;

//     public constructor(readonly el: HTMLDivElement){
//         super(el);
//         this.my_inputs = new Inputs(this.inputs);
//     }
// }

// class TS_inputs_Container2{

// }

// class TS_top_left_cell_contents_Container2 {

//     public constructor(protected readonly inputs: TS_inputs_Container2){
//     }
// };

// class IDE2 extends TS_top_left_cell_contents_Container2  {

//     public constructor(protected readonly inputs: Inputs2){
//         super(inputs);
//     }
// }


// class Inputs2 extends TS_inputs_Container2 {
// }

// class FactArgs{
//     inputs_cls?: typeof TS_inputs_Container2;
//     numbo?: number;
// }

// function factory(fa: FactArgs){
//     const inputs_cls = fa.inputs_cls !== undefined ? fa.inputs_cls : TS_inputs_Container2;
//     const numbo = fa.numbo !== undefined ? fa.numbo : 3;
// }

// factory({inputs_cls: Inputs2});
// factory({});

// const renderPaymentCopy = (args: {
//     display_as_amount: number;
//     amount_to_points_ratio: number;
//     amount: number;
//     currency: string;
//     amount_approved: number;
//     status?: 'approved' | 'rejected';
//   }) => {
//     const status = args.status !== undefined ? args.status : "approved";


//   };


class Inner {
    public constructor(protected el: HTMLDivElement){}
}

class Outer {
    public constructor(protected inner: Inner){}
}



interface Args{
    make_outer?: typeof Outer;
    make_inner?: typeof Inner;
}


export function makeThem(args: Args){
 const el = document.createElement("div");
 const make_outer = args.make_outer !== undefined ? args.make_outer : Outer;
 const make_inner = args.make_inner !== undefined ? args.make_inner : Inner;

 const inner = new make_inner(el);
 const outer = new make_outer(inner);
}


class MyInner extends Inner {
    public constructor(el: HTMLDivElement){
        super(el);
    }

    public foo(){}
}

class MyOuter extends Outer {
    // protected inner: MyInner;

    public constructor(){
        super({} as Inner);
        // this.inner = inner;
        // this.inner.foo();
    }
}

makeThem({make_inner: MyInner, make_outer: MyOuter, });
