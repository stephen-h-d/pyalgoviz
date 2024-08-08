

import { BehaviorSubject } from 'rxjs';

const pyodideWorker = new Worker('/pyodide-0.21.3/webworker.js');

const callbacks = new Map<number, (arg: string) => void>();
export const pyodide_ready = new BehaviorSubject<boolean>(false);

pyodideWorker.onmessage = event => {
  if (event.data.pyodide_ready !== undefined) {
    pyodide_ready.next(true);
    return;
  }

  const { id, result } = event.data;
  const onSuccess = callbacks.get(id as number);
  if (onSuccess !== undefined) {
    callbacks.delete(id as number);
    onSuccess(result as string);
  }
};

export const asyncRun = (() => {
  let id = 0; // identify a Promise
  // the Promise has a success value of string, which is a JSON string.
  // we use JSON strings because the conversion between JS and Python objects
  // is a bit wonky.  Different types need to be converted in different ways.
  // So we bypass that and just use JSON.
  return (script: string, context: object): Promise<string> => {
    // the id could be generated more carefully
    id = (id + 1) % Number.MAX_SAFE_INTEGER;

    return new Promise(onSuccess => {
      // TODO add onError / reject here?
      callbacks.set(id, onSuccess);
      pyodideWorker.postMessage({
        ...context,
        python: script,
        id,
      });
    });
  };
})();
