### Ready-to-implement TODOs

2. Support loading and saving all of the user's scripts
4. Support running server-side in a sandboxed manner
5. Support caching the results (once running server-side is implemented)
6. Make a landing page with running algorithms.  (This will likely depend on the cache)
7. Prevent user from saving/loading, but not running, when they are not logged in.
10. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
12. Disable all the buttons when:
    * pyodide is not loaded
    * a script is already running in pyodide
12b. Disable all buttons except "Run" when nothing's been run or there's been a doc change since something's been run
13. Disallow the user from editing while the animation is running.
14. Allow the user to cancel a running script
    * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
15. Pare down the number of arguments by making an `Editors` class (possibly replacing `EditorsMgr`) and whatever else comes to mind.
16. Switch to using vanilla extract

### Planning TODOs
1. Make a plan for the layout.
2. Decide which other login ID providers to support and make TODO items for those.
3. Make unit tests?  with vite-test?
4. Make integration tests?  with Selenium?
5. Make a plan to improve the slider functionality
