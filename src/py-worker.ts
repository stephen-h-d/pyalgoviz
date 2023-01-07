const pyodideWorker = new Worker("pyodide-0.21.3/webworker.js");

const callbacks = new Map();

pyodideWorker.onmessage = (event) => {
  const { id, result } = event.data;
  const onSuccess = callbacks.get(id);
  callbacks.delete(id);
  onSuccess(result);
};

const asyncRun = (() => {
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

export { asyncRun };
