import { BehaviorSubject } from "rxjs";

const pyodideWorker = new Worker("pyodide-0.21.3/webworker.js");

const callbacks = new Map();
export const pyodide_ready = new BehaviorSubject<boolean>(false);

pyodideWorker.onmessage = (event) => {
  if (event.data.pyodide_ready !== undefined) {
    pyodide_ready.next(true);
    return;
  }

  const { id, result } = event.data;
  const onSuccess = callbacks.get(id);
  callbacks.delete(id);
  onSuccess(result);
};

export const asyncRun = (() => {
  let id = 0; // identify a Promise
  return (script: string, context: object): Promise<any> => {

    // the id could be generated more carefully
    id = (id + 1) % Number.MAX_SAFE_INTEGER;

    return new Promise((onSuccess) =>  { // TODO add onError / reject here?
      callbacks.set(id, onSuccess);
      pyodideWorker.postMessage({
        ...context,
        python: script,
        id,
      });
    });

  };

})();
