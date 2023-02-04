export interface VizEvent {
    lineno: number,
    viz_output: string, // a JavaScript script
    viz_error: string,
    viz_log: string,
    algo_log: string,
}

export interface ExecResult {
    py_error: string;
    events: VizEvent[];
}
