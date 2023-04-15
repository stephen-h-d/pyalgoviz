import { Observable, Subject } from "rxjs";
import type {PyError, RunResult} from "./runner";

export class AlgoState {
    public constructor(public log: string, public lineno: number, public py_error: PyError | null){}
}

export class VizState {
    public constructor(public log: string, public viz_error: string | null){}
}

export class RunSummary {
    public constructor(public num_events: number, public py_error: PyError | null){}
}

class RunVizState {
    private current_event_idx = 0;
    private algo_state: Subject<AlgoState> = new Subject();
    private viz_state: Subject<VizState> = new Subject();
    private viz_output: Subject<string> = new Subject();

    public constructor(public run_result: RunResult) {

    }

    public updateSubjects(){
        const current_event = this.run_result.events[this.current_event_idx];

        const algo_state = new AlgoState(current_event.algo_log, current_event.lineno, this.run_result.py_error);
        const viz_state = new VizState(current_event.viz_log, current_event.viz_error);

        this.algo_state.next(algo_state);
        this.viz_state.next(viz_state);
        this.viz_output.next(current_event.viz_output);
    }

    public increment(val: number){
        this.current_event_idx += val;
        this.constrain_current_event_idx();
        this.updateSubjects();
    }

    public setCurrentEvent(val: number){
        this.current_event_idx = val;
        this.constrain_current_event_idx;
    }

    private constrain_current_event_idx() {
        this.current_event_idx = Math.max(this.current_event_idx, 0);
        this.current_event_idx = Math.min(this.current_event_idx, this.run_result.events.length);
    }
}

export class RunVizDispatcher {
    private run_viz_state: Subject<RunVizState | null> = new Subject();

    public constructor(run_result_observable: Observable<RunResult>) {
        run_result_observable.subscribe(this.nextRunResult.bind(this));
    }

    private nextRunResult(run_result: RunResult) {
        if (run_result.events.length === 0) {
            this.run_viz_state.next(null);
        } else {
            this.run_viz_state.next(new RunVizState(run_result));
        }
    }
}
