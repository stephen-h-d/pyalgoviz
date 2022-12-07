### Ready-to-implement TODOs

0. Make HMR work with vanilla TS
    * Possibly use https://github.com/OmarShehata/vite-hot-reload-example
    * This seems to work well / okay for what it does, but it requires doing things like what is done in `index.js` in the example that I'm not sure of
1. Add output area for visualization errors.  (Later on maybe we'll make it hideable)
1. Finish up highlighting stuff
    1. For viz view, highlight with red when there's an error
    2. When the doc changes, reset the line to highlight to -1.
2. Support loading and saving all of the user's scripts
4. Support running server-side in a sandboxed manner
5. Support caching the results (once running server-side is implemented)
6. Make a landing page with running algorithms.  (This will likely depend on the cache)
7. Prevent user from saving/loading, but not running, when they are not logged in.
8. Support the slider
9. Prevent the user from editing the code while it is running
10. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
11. Separate the visualizer, animator, editorsMgr
    * Note: This will likely require one setup file (edit.ts) and separate files for each of those classes
12. Disable all the buttons when:
    * pyodide is not loaded
    * a script is already running in pyodide
13. Disallow the user from editing while the animation is running.
14. Allow the user to cancel a running script
    * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough

### Planning TODOs
1. Make a plan for the layout.
2. Decide which other login ID providers to support and make TODO items for those.
3. Make unit tests?
4. Make integration tests?
