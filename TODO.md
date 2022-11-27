### Ready-to-implement TODOs

1. Highlight lines in algo and viz area
    1. For both algo view and viz view:
        1. Highlight with red when there's an error
        2. Highlight with light blue-green (current color) when just going through normal animation
            * Note: I will need to create and export different effects (e.g. `lineToHighlightChangedEffect`) for each one.
    2. When the doc changes, reset the line to highlight to -1.
2. Support loading and saving all of the user's scripts
3. Use basic EditorView themes
4. Support running server-side in a sandboxed manner
5. Support caching the results (once running server-side is implemented)
6. Make a landing page with running algorithms.  (This will likely depend on the cache)
7. Prevent user from saving/loading, but not running, when they are not logged in.
8. Support the slider
9. Prevent the user from editing the code while it is running
10. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
11. Separate the visualizer, animator, editorsMgr
    * Note: This will likely require one setup file (edit.ts) and separate files for each of those classes
    * Note: It might also require a separate file for initializing editor views.  Either that or EditorsMgr initializes the editors.
12. Disable all the buttons when:
    * pyodide is not loaded
    * a script is already running in pyodide
13. Disallow the user from editing while the animation is running.
14. Allow the user to cancel a running script
    * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough

### Planning TODOs
1. Make a plan for the layout.
2. Decide which other login ID providers to support and make TODO items for those.
