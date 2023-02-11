export interface PythonScriptError {
    lineno: number,
    error_msg: string,
}

export interface VizEvent {
    lineno: number,
    viz_output: string, // a JavaScript script
    viz_error: PythonScriptError | null,
    viz_log: string,
    algo_log: string,
}

export interface ExecResult {
    py_error: string;
    events: VizEvent[];
}
