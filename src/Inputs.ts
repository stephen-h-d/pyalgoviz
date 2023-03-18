import * as clses from "./generated/classes";
import { BehaviorSubject, combineLatest, Observable, Subject } from "rxjs";
import { pyodide_ready } from "./py-worker";
import { DelayedInitObservable } from "./delayed_init_obs";
import { EventNavObservables, VizEventIdx } from "./vizEvents";
import { eventHappened } from "./eventHappened";
import { ExecResult } from "./exec_result";

export class Inputs extends clses.TS_inputs_Container {

  private saveClicked$: Observable<null>;
  private runClicked$: Observable<null>;
  private prevClicked$: Observable<null>;
  private nextClicked$: Observable<null>;
  private speed$ = new BehaviorSubject("Medium");
  private sliderIndex$ = new Subject<number>();
  private playPauseClicked$: Observable<null>;
  private readonly exec_result$: DelayedInitObservable<ExecResult> = new DelayedInitObservable();
  private readonly playing$: DelayedInitObservable<boolean> = new DelayedInitObservable();

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
    this.els.extra_slow.textContent = "Extra Slow";
    this.els.speed.selectedIndex = 2;
    this.els.slider.type = "range";
    this.disableRangeSlider();

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
    this.els.slider.addEventListener("input", this.handleSliderValueChanged.bind(this));

    for (const input of [this.els.save, this.els.prev, this.els.next, this.els.play]) {
      input.disabled = true;
    }

    this.event_idx$.obs$().subscribe(this.nextEventIdx.bind(this));

    this.els.run.disabled = !pyodide_ready.getValue(); // TODO improve this.  This is a fix for HMR
    combineLatest([pyodide_ready, this.pyodide_running$.obs$()]).subscribe(this.pyodideUpdate.bind(this));
    combineLatest([this.pyodide_running$.obs$(), this.exec_result$.obs$()]).subscribe(this.handleExecResult.bind(this));
    this.playing$.obs$().subscribe(this.handlePlaying.bind(this));
  }

  private handleSliderValueChanged(_event: Event){
    this.sliderIndex$.next(Number(this.els.slider.value));
  }

  private handlePlaying(playing: boolean){
    this.els.play.textContent = playing ? "Pause" : "Play";
  }

  private disableRangeSlider(){
    this.els.slider.disabled = true;
  }

  private handleExecResult(update: [boolean, ExecResult]){
    const [running, exec_result] = update;
    const have_useful_result = exec_result.events.length > 0 && exec_result.py_error === null;
    if (have_useful_result && !running){
      this.els.play.disabled = false;
    } else {
      this.els.play.disabled = true;
    }

    if (have_useful_result){
      this.els.slider.min = "0";
      this.els.slider.max = String(exec_result.events.length - 1);
      this.els.slider.value = "0";
      this.els.slider.disabled = false;
    } else {
      this.disableRangeSlider();
    }
  }

  private nextEventIdx(event_idx: VizEventIdx) {
    this.els.prev.disabled = !event_idx.canGoPrev();
    this.els.next.disabled = !event_idx.canGoNext();
  }

  public addEventIdx$(event_idx$: Observable<VizEventIdx>) {
    this.event_idx$.init(event_idx$);
  }

  private pyodideUpdate(pyodide_update: [boolean, boolean]) {
    const [avail, running] = pyodide_update;
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

  public navigationInputs(): EventNavObservables {
    return {
      prev$: this.prevClicked$,
      next$: this.nextClicked$,
      playPause$: this.playPauseClicked$,
      speed$: this.speed$,
      sliderIndex$: this.sliderIndex$,
    };
  }

  public addExecResult$(exec_result$: Observable<ExecResult>){
    this.exec_result$.init(exec_result$);
  }

  public addPlaying$(playing$: Observable<boolean>){
    this.playing$.init(playing$);
  }
}
