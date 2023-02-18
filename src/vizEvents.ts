import { BehaviorSubject, filter, Observable, Subject, take, takeUntil, timer } from "rxjs";
import { DelayedInitObservable } from "./delayed_init_obs";
import { ExecResult, VizEvent } from "./exec_result";

export interface ObservableWithValue<T> extends Observable<T> {
  getValue(): T
}

export interface NavigationInputsObservables {
  readonly prev$: Observable<null>;
  readonly next$: Observable<null>;
  readonly play_pause$: Observable<null>;
  readonly speed$: ObservableWithValue<string>;
  readonly sliderIndex$: Observable<number>;
}

export interface EventsObservables {
  readonly events: Observable<ExecResult>;
  readonly inputs_clicked: NavigationInputsObservables;
}

export class VizEventIdx {
  public constructor(public current: number, public total: number){}

  public canGoNext(){
    return this.total > 0 && this.current < this.total - 1;
  }

  public canGoPrev(){
    return this.total > 0 && this.current > 0;
  }

  public eventsRemaining(){
    return this.total - this.current - 1;
  }
}

export class VizEventIdxSubject {
  private event_idx = new VizEventIdx(-1, 0);
  private subject = new BehaviorSubject(this.event_idx);

  public obs$(): Observable<VizEventIdx>{
    return this.subject;
  }

  public reset(total?: number){
    let new_total = total === undefined ? this.event_idx.total : total;
    this.event_idx = new VizEventIdx(-1, new_total);
    this.subject.next(this.event_idx);
  }

  public canGoNext(){
    return this.event_idx.canGoNext();
  }

  public next(){
    if (!this.canGoNext()){
      console.error(`Tried to go to next event when we were already at the last event: ${this.event_idx.current} / ${this.event_idx.total}`);
    } else {
      this.event_idx.current += 1;
      this.subject.next(this.event_idx);
    }
  }

  public canGoPrev(){
    return this.event_idx.canGoPrev();
  }

  public prev(){
    if (!this.canGoPrev()){
      console.error("Tried to go to prev event when we were already at the first event");
    } else {
      this.event_idx.current -= 1;
      this.subject.next(this.event_idx);
    }
  }

  public goTo(index: number){
    if (index < 0 || index >= this.event_idx.total){
      console.error(`Tried to go to to an index: ${index}`);
    } else {
      this.event_idx.current = index;
      this.subject.next(this.event_idx);
    }
  }

  public eventsRemaining(){
    return this.event_idx.eventsRemaining();
  }
}

function getSpeedDelay(speed: string) {
  switch (speed) {
    case "Very Fast": return 1;
    case "Fast": return 10;
    case "Medium": return 25;
    case "Slow": return 50;
    case "Very Slow": return 200;
    case "Extra Slow": return 1000;
  }
  return 25;
}

export class VizEventNavigator {
  private readonly current_event$: Subject<VizEvent | null> = new Subject();

  private event_idx_subject = new VizEventIdxSubject();
  private exec_result: ExecResult = {py_error: null, events: []};
  private readonly exec_result$: DelayedInitObservable<ExecResult> = new DelayedInitObservable();
  private event_timer$: Observable<number> | null = null;

  private readonly playing$ = new BehaviorSubject<boolean>(false);

  public constructor(private readonly inputs_clicked: NavigationInputsObservables){
    this.inputs_clicked.prev$.subscribe(this.event_idx_subject.prev.bind(this.event_idx_subject));
    this.inputs_clicked.next$.subscribe(this.event_idx_subject.next.bind(this.event_idx_subject));
    this.inputs_clicked.play_pause$.subscribe(this.playPause.bind(this));
    this.inputs_clicked.sliderIndex$.subscribe(this.handleSliderIndex.bind(this));
    this.exec_result$.obs$().subscribe(this.nextEvents.bind(this));
    this.event_idx_subject.obs$().subscribe(this.nextEventIdx.bind(this));
  }

  private handleSliderIndex(index: number){
    this.event_idx_subject.goTo(index);
    // TODO update output... for whatever reason, it isn't being updated rn
  }

  private nextEventIdx(event_idx: VizEventIdx){
    if (event_idx.current > 0) {
      this.current_event$.next(this.exec_result.events[event_idx.current]);
    } else {
      this.current_event$.next(null);
    }
  }

  private playPause(){
    if (this.playing$.getValue()){
      this.playing$.next(false);
    } else {
      this.playing$.next(true);
      const notPlaying = this.playing$.pipe(filter((val) => !val));
      const speed = this.inputs_clicked.speed$.getValue();
      const delay = getSpeedDelay(speed);

      if (this.event_idx_subject.eventsRemaining() === 0) {
        this.event_idx_subject.reset();
      }

      this.event_timer$ = timer(delay,delay).pipe(
        takeUntil(notPlaying),
        take(this.event_idx_subject.eventsRemaining())
        );
      this.event_timer$.subscribe(
        {
          next: this.event_idx_subject.next.bind(this.event_idx_subject),
          complete: () => {this.playing$.next(false);}
        }
        );
    }
  }

  private nextEvents(exec_result: ExecResult){
    this.exec_result = exec_result;
    this.event_idx_subject.reset(exec_result.events.length);
  }

  public getVizEventIdx$(): Observable<VizEventIdx>{
    return this.event_idx_subject.obs$();
  }

  public getEvent$(): Observable<VizEvent | null>{
    return this.current_event$;
  }

  public getPlaying$(): Observable<boolean>{
    return this.playing$;
  }

  public addExecResult$(events$: Observable<ExecResult>){
    this.exec_result$.init(events$);
  }
}
