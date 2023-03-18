import { asyncRun } from "./py-worker";
import { executorScript } from "./executor";
import {from, Observable, Subject} from "rxjs";

export class PyError {
  public constructor(public lineno: number, public msg: string){}
}

export class Event {
  public constructor(public lineno: number, public viz_output: string, public viz_error: string, public viz_log: string, public algo_log: string){}
}

export class RunResult {
  // TODO figure out the actual type of result and error
  public constructor(public py_error: PyError | null, public events: Event[]) {
  }
}

export class Runner {
  private _running: Subject<boolean> = new Subject();
  private _run_result: Subject<RunResult> = new Subject();

  public constructor(){
    this._running.next(false);
  }

  private runFinished(data: any): void {
    this._running.next(false);
    const run_result = JSON.parse(data as string);

    // TODO validate the run result object instead of only casting it
    this._run_result.next(run_result as RunResult);
  }

  private runErrored(error: any){
    // TODO better handle this error (possibly elsewhere, but we would at least
    // need to call next() on a Subject or something). Note -- there is more
    // error-handling code to be written in, e.g., py-worker.ts in order for
    // this runErrored to be called.
    console.error("run error", error);
    this._running.next(false);
  }

  public run(algo_script: string, viz_script: string) {
    // 1. cancel any currently running stuff
    // 2. run the scripts

    const context = {
        script: algo_script,
        viz: viz_script,
        showVizErrors: true,
      };

    this._running.next(true);
    const runEvent = from(asyncRun(executorScript, context));
    runEvent.subscribe({
        next: this.runFinished.bind(this),
        error: this.runErrored.bind(this)
    });
  }

  public running(): Observable<boolean> {
    return this._running;
  }

  public runResult(): Observable<RunResult> {
    return this._run_result;
  }
}
