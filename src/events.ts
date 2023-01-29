import { BehaviorSubject, Observable, Subject, take, takeUntil, timer } from "rxjs";
import { DelayedInitObservable } from "./delayed_init_obs";

export interface NavigationInputsClicked {
  readonly prev$: Observable<null>;
  readonly next$: Observable<null>;
  readonly play_pause$: Observable<null>;
}

export interface EventsObservables {
  readonly events: Observable<string[]>;
  readonly inputs_clicked: NavigationInputsClicked;
}

export class EventNavigator {
  private readonly event$: Subject<string | null> = new Subject();

  private current_event = -1;
  private events: string[] = [];
  private readonly events$: DelayedInitObservable<string[]> = new DelayedInitObservable();
  private event_timer$: Observable<number> | null = null;

  private readonly playing$ = new BehaviorSubject<boolean>(false);

  public constructor(private readonly inputs_clicked: NavigationInputsClicked){
    this.inputs_clicked.prev$.subscribe(this.prev.bind(this));
    this.inputs_clicked.next$.subscribe(this.next.bind(this));
    this.inputs_clicked.play_pause$.subscribe(this.playPause.bind(this));
    this.events$.obs$().subscribe(this.nextEvents.bind(this));
  }

  private next(){
    if (this.current_event >= this.events.length - 1){
      console.error("Tried to go to next event when we were already at the last event");
    } else {
      this.current_event += 1;
      this.event$.next(this.events[this.current_event]);
    }
  }

  private prev(){
    if (this.current_event <= 0){
      console.error("Tried to go to prev event when we were already at the first event");
    } else {
      this.current_event -= 1;
      this.event$.next(this.events[this.current_event]);
    }
  }

  private playPause(){
    if (this.playing$.getValue()){
      this.playing$.next(false);
    } else {
      const events_remaining = this.events.length - this.current_event - 1;
      this.playing$.next(true);
      this.event_timer$ = timer(1000,1000).pipe(
        takeUntil(this.playing$),
        take(events_remaining)
        );
      this.event_timer$.subscribe(this.next.bind(this));
    }
  }

  private nextEvents(events: string[]){
    this.events = events;
    if (this.events.length === 0) {
      this.current_event = -1;
      this.event$.next(null);
    } else {
      this.current_event = 0;
      this.event$.next(this.events[this.current_event]);
    }
  }

  public getEvent$(): Observable<string | null>{
    return this.event$;
  }

  public getPlaying$(): Observable<boolean>{
    return this.playing$;
  }

  public setEvents$(events$: Observable<string[]>){
    this.events$.init(events$);
  }
}
