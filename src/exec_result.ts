export interface PythonScriptError {
  lineno: number;
  error_msg: string;
  script: "algo" | "viz";
}

export interface VizEvent {
  lineno: number;
  viz_output: string; // a JavaScript script
  viz_error_line: number | null;
  viz_log: string;
  algo_log: string;
}

export interface ExecResult {
  py_error: PythonScriptError | null;
  events: VizEvent[];
}

export interface PyAlgoVizScript {
  algo_script: string;
  viz_script: string;
}
