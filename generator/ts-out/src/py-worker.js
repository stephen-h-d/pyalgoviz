const pyodideWorker = new Worker("pyodide-0.21.3/webworker.js");
const callbacks = new Map();
class RunResult {
    py_error;
    events;
    // TODO figure out the actual type of result and error
    constructor(py_error, events) {
        this.py_error = py_error;
        this.events = events;
    }
}
pyodideWorker.onmessage = (event) => {
    const { id, ...data } = event.data;
    const onSuccess = callbacks.get(id);
    callbacks.delete(id);
    const results = data["results"];
    onSuccess(new RunResult(results.get("py_error"), results.get("events")));
};
const asyncRun = (() => {
    let id = 0; // identify a Promise
    return (script, context) => {
        // the id could be generated more carefully
        id = (id + 1) % Number.MAX_SAFE_INTEGER;
        return new Promise((onSuccess) => {
            callbacks.set(id, onSuccess);
            pyodideWorker.postMessage({
                ...context,
                python: script,
                id,
            });
        });
    };
})();
export { asyncRun };
