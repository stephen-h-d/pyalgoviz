import { BehaviorSubject, filter, Observable, Subject, take, takeUntil, tap, timer } from "rxjs";
import { DelayedInitObservable } from "./delayed_init_obs";
import { ExecResult, VizEvent } from "./exec_result";

export interface ObservableWithValue<T> extends Observable<T> {
  getValue(): T
}

export interface NavigationInputsClicked {
  readonly prev$: Observable<null>;
  readonly next$: Observable<null>;
  readonly play_pause$: Observable<null>;
  readonly speed$: ObservableWithValue<string>;
}

export interface EventsObservables {
  readonly events: Observable<ExecResult>;
  readonly inputs_clicked: NavigationInputsClicked;
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
    return this.total - this.current;
  }
}

export class VizEventIdxSubject {
  private event_idx = new VizEventIdx(-1, 0);
  private subject = new BehaviorSubject(this.event_idx); 

  public obs$(): Observable<VizEventIdx>{
    return this.subject;
  }

  public reset(total: number){
    this.event_idx = new VizEventIdx(-1, total);
    this.subject.next(this.event_idx);
  }

  public canGoNext(){
    return this.event_idx.canGoNext();
  }

  public next(){
    if (!this.canGoNext()){
      console.error("Tried to go to next event when we were already at the last event");
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

  public eventsRemaining(){
    return this.event_idx.eventsRemaining();
  }
}

export class VizEventNavigator {
  private readonly current_event$: Subject<VizEvent | null> = new Subject();

  private event_idx_subject = new VizEventIdxSubject();
  private exec_result: ExecResult = {py_error: "", events: []};
  private readonly exec_result$: DelayedInitObservable<ExecResult> = new DelayedInitObservable();
  private event_timer$: Observable<number> | null = null;

  private readonly playing$ = new BehaviorSubject<boolean>(false);

  public constructor(private readonly inputs_clicked: NavigationInputsClicked){
    this.inputs_clicked.prev$.subscribe(this.event_idx_subject.prev.bind(this.event_idx_subject));
    this.inputs_clicked.next$.subscribe(this.event_idx_subject.next.bind(this.event_idx_subject));
    this.inputs_clicked.play_pause$.subscribe(this.playPause.bind(this));
    this.exec_result$.obs$().subscribe(this.nextEvents.bind(this));
    this.event_idx_subject.obs$().subscribe(this.nextEventIdx.bind(this));
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

      // TODO do the speed thing
      this.event_timer$ = timer(1000,1000).pipe(
        takeUntil(notPlaying),
        take(this.event_idx_subject.eventsRemaining())
        );
      this.event_timer$.subscribe(console.log);
      this.event_timer$.subscribe(this.event_idx_subject.next.bind(this.event_idx_subject));
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
