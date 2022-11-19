const pyodideWorker = new Worker("./static/js/webworker.js");

const callbacks = new Map();

class RunResult {
  // TODO figure out the actual type of result and error
  public constructor(public results: any, public error: any) {
  }
}

pyodideWorker.onmessage = (event) => {
  const { id, ...data } = event.data;
  const onSuccess = callbacks.get(id);
  callbacks.delete(id);
  onSuccess(new RunResult(data["result"], data["error"]));
};

const asyncRun = (() => {
  let id = 0; // identify a Promise
  return (script: string, context: object): Promise<RunResult> => {

    // the id could be generated more carefully
    id = (id + 1) % Number.MAX_SAFE_INTEGER;

    return new Promise((onSuccess) =>  {
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
