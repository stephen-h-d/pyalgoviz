import * as clses from "./generated/classes";
import { BehaviorSubject, combineLatest, Observable } from "rxjs";
import { pyodide_ready } from "./py-worker";
import { DelayedInitObservable } from "./delayed_init_obs";
import { NavigationInputsClicked, VizEventIdx } from "./vizEvents";
import { eventHappened } from "./eventHappened";

export class Inputs extends clses.TS_inputs_Container {

  private saveClicked$: Observable<null>;
  private runClicked$: Observable<null>;
  private prevClicked$: Observable<null>;
  private nextClicked$: Observable<null>;
  private speed$ = new BehaviorSubject("Medium");
  private playPauseClicked$: Observable<null>;

  private pyodide_running$: DelayedInitObservable<boolean> = new DelayedInitObservable(
    () => new BehaviorSubject(false)
  );

  private event_idx$: DelayedInitObservable<VizEventIdx> = new DelayedInitObservable();

  public constructor(els: clses.TS_inputs_ContainerElements) {
    super(els);
    this.els.very_fast.textContent = "Very Fast";
    this.els.fast.textContent = "Fast";
    this.els.medium.textContent = "Medium";
    this.els.slow.textContent = "Slow";
    this.els.very_slow.textContent = "Very Slow";
    this.els.speed.selectedIndex = 2;

    this.els.save.textContent = "Save";
    this.els.run.textContent = "Run";
    this.els.prev.textContent = "Previous";
    this.els.next.textContent = "Next";
    this.els.play.textContent = "Play";

    this.saveClicked$ = eventHappened(this.els.save, "click");
    this.runClicked$ = eventHappened(this.els.run, "click");
    this.prevClicked$ = eventHappened(this.els.prev, "click");
    this.nextClicked$ = eventHappened(this.els.next, "click");
    this.playPauseClicked$ = eventHappened(this.els.play, "click");
    this.els.speed.addEventListener("change", (_event) => this.speed$.next(this.els.speed.value));

    for (const input of [this.els.save, this.els.prev, this.els.next, this.els.play]) {
      input.disabled = true;
    }
    this.els.play.disabled = false; // TODO make this something better

    this.event_idx$.obs$().subscribe(this.nextEventIdx.bind(this));

    this.els.run.disabled = !pyodide_ready.getValue(); // TODO improve this.  This is a fix for HMR
    combineLatest([pyodide_ready, this.pyodide_running$.obs$()]).subscribe(this._pyodide_update.bind(this));
  }

  private nextEventIdx(event_idx: VizEventIdx) {
    this.els.prev.disabled = !event_idx.canGoPrev();
    this.els.next.disabled = !event_idx.canGoNext();
  }

  public addEventIdx$(event_idx$: Observable<VizEventIdx>) {
    this.event_idx$.init(event_idx$);
  }

  private _pyodide_update(pyodide_update: [boolean, boolean]) {
    const [avail, running] = pyodide_update;
    console.log(`avail ${avail} running ${running}`);
    this.els.run.disabled = !avail || running;
  }

  public addPyodideRunning(pyodide_running: Observable<boolean>) {
    this.pyodide_running$.init(pyodide_running);
  }

  public saveClicked(): Observable<null> {
    return this.saveClicked$;
  }

  public runClicked(): Observable<null> {
    return this.runClicked$;
  }

  public prevClicked(): Observable<null> {
    return this.prevClicked$;
  }

  public nextClicked(): Observable<null> {
    return this.nextClicked$;
  }

  public playClicked(): Observable<null> {
    return this.playPauseClicked$;
  }

  public navigationInputs(): NavigationInputsClicked {
    return {
      prev$: this.prevClicked$,
      next$: this.nextClicked$,
      play_pause$: this.playPauseClicked$,
      speed$: this.speed$,
    };
  }
}
