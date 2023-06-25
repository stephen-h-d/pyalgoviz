import {
  Accessor,
  Setter,
  createEffect,
  createSignal,
  observable,
} from 'solid-js';
import { ExecResult, VizEvent } from './exec_result';
import { filter, from, Observable, take, takeUntil, timer } from 'rxjs';

export interface ObservableWithValue<T> extends Observable<T> {
  getValue(): T;
}

export const Speed = {
  'Very Fast (1000/s)': 1000,
  'Fast (100/s)': 100,
  'Medium (40/s)': 40,
  'Slow (20/s)': 20,
  'Very Slow (5/s)': 5,
  'Extra Slow (1/s)': 1,
};

export interface EventNavObservables {
  readonly prev$: Observable<null>;
  readonly playPause$: Observable<boolean | null>;
  readonly next$: Observable<null>;
  readonly speed$: ObservableWithValue<keyof typeof Speed>;
  readonly sliderIndex$: Observable<number>;
}

export interface EventsAccessors {
  readonly events: Accessor<ExecResult>;
  readonly inputs_clicked: EventNavObservables;
}

export class VizEventIdx {
  public constructor(
    public readonly current: number,
    public readonly total: number,
  ) {}

  public canGoNext() {
    return this.total > 0 && this.current < this.total - 1;
  }

  public canGoPrev() {
    return this.total > 0 && this.current > 0;
  }

  public eventsRemaining() {
    return this.total - this.current - 1;
  }

  public next() {
    return new VizEventIdx(this.current + 1, this.total);
  }

  public prev() {
    return new VizEventIdx(this.current - 1, this.total);
  }

  public goTo(current: number) {
    return new VizEventIdx(current, this.total);
  }
}

export class VizEventIdxSig {
  private event_idx = new VizEventIdx(-1, 0);
  private readonly subject: Accessor<VizEventIdx>;
  private readonly setSubject: Setter<VizEventIdx>;

  public constructor() {
    // eslint-disable-next-line solid/reactivity
    [this.subject, this.setSubject] = createSignal(this.event_idx);
  }

  public val(): VizEventIdx {
    return this.subject();
  }

  public reset(total?: number) {
    const new_total = total === undefined ? this.event_idx.total : total;
    this.event_idx = new VizEventIdx(-1, new_total);
    this.setSubject(this.event_idx);
  }

  public canGoNext() {
    return this.event_idx.canGoNext();
  }

  public goNext() {
    if (!this.canGoNext()) {
      console.error(
        `Tried to go to next event when we were already at the last event: ${this.event_idx.current} / ${this.event_idx.total}`,
      );
    } else {
      this.event_idx = this.event_idx.next();
      this.setSubject(this.event_idx);
    }
  }

  public canGoPrev() {
    return this.event_idx.canGoPrev();
  }

  public goPrev() {
    if (!this.canGoPrev()) {
      console.error(
        'Tried to go to prev event when we were already at the first event',
      );
    } else {
      this.event_idx = this.event_idx.prev();
      this.setSubject(this.event_idx);
    }
  }

  public goTo(pct: number) {
    if (pct < 0 || pct > 1) {
      console.error(`Tried to go to an invalid pct: ${pct}`);
    } else {
      let newIdx = Math.round(pct * this.event_idx.total);
      newIdx = Math.min(Math.max(0, newIdx), this.event_idx.total);
      this.event_idx = this.event_idx.goTo(newIdx);
      this.setSubject(this.event_idx);
    }
  }

  public eventsRemaining() {
    return this.event_idx.eventsRemaining();
  }
}

export class VizEventNavigator {
  private readonly currentEvent: Accessor<VizEvent | null>;
  private readonly setCurrentEvent: Setter<VizEvent | null>;

  private event_idx_subject = new VizEventIdxSig();
  private exec_result: ExecResult = { py_error: null, events: [] };
  private event_timer$: Observable<number> | null = null;

  private readonly playing: Accessor<boolean>;
  private readonly setPlaying: Setter<boolean>;

  public constructor(
    private readonly inputs_clicked: EventNavObservables,
    private readonly exec_result_arg: Accessor<ExecResult> | ExecResult,
  ) {
    // eslint-disable-next-line solid/reactivity
    [this.currentEvent, this.setCurrentEvent] = createSignal<VizEvent | null>(
      null,
    );
    // eslint-disable-next-line solid/reactivity
    [this.playing, this.setPlaying] = createSignal(false);

    this.inputs_clicked.prev$.subscribe(
      this.event_idx_subject.goPrev.bind(this.event_idx_subject),
    );
    this.inputs_clicked.next$.subscribe(
      this.event_idx_subject.goNext.bind(this.event_idx_subject),
    );
    this.inputs_clicked.playPause$.subscribe(this.playPause.bind(this));
    this.inputs_clicked.sliderIndex$.subscribe(this.handleSliderPct.bind(this));

    if (typeof exec_result_arg === 'object') {
      this.nextEvents(exec_result_arg);
    } else {
      createEffect(() => {
        this.nextEvents(exec_result_arg());
      });
    }

    createEffect(() => {
      this.nextEventIdx(this.event_idx_subject.val());
    });
  }

  private handleSliderPct(index: number) {
    this.event_idx_subject.goTo(index);
  }

  private nextEventIdx(event_idx: VizEventIdx) {
    console.log('next event idx', event_idx);
    if (event_idx.current > 0) {
      this.setCurrentEvent(this.exec_result.events[event_idx.current]);
    } else {
      this.setCurrentEvent(null);
    }
  }

  public playingAcc(): Accessor<boolean> {
    return this.playing;
  }

  private playPause(value: boolean | null) {
    console.log('fudge Playing status:', this.playing());
    console.log('fudge Event index subject:', this.event_idx_subject);
    console.log(
      'fudge Events remaining:',
      this.event_idx_subject.eventsRemaining(),
    );

    if (this.playing() && (value === null || value === false)) {
      this.setPlaying(false);
    } else if (!this.playing() && (value === null || value === true)) {
      this.setPlaying(true);
      const playing$ = from(observable(this.playing));
      const notPlaying = playing$.pipe(filter(val => !val));
      const speed = this.inputs_clicked.speed$.getValue();
      const rate_per_s = Speed[speed.valueOf() as keyof typeof Speed];
      const delay = (1 / rate_per_s) * 1000;
      console.log('delay', delay);

      if (this.event_idx_subject.eventsRemaining() === 0) {
        console.log('resetting event idx');
        this.event_idx_subject.reset();
      }

      this.event_timer$ = timer(0, delay).pipe(
        takeUntil(notPlaying),
        take(this.event_idx_subject.eventsRemaining()),
      );
      this.event_timer$.subscribe({
        next: this.event_idx_subject.goNext.bind(this.event_idx_subject),
        complete: () => {
          this.setPlaying(false);
        },
      });
    }
  }

  private nextEvents(exec_result: ExecResult) {
    this.exec_result = exec_result;
    this.event_idx_subject.reset(exec_result.events.length);
  }

  public getVizEventIdxVal(): VizEventIdx {
    return this.event_idx_subject.val();
  }

  public getEventVal(): Accessor<VizEvent | null> {
    return this.currentEvent;
  }

  public getPlaying$(): Accessor<boolean> {
    return this.playing;
  }
}
