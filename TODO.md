### Ready-to-implement TODOs

1. Support running server-side in a sandboxed manner
2. Support caching the results (once running server-side is implemented)
3. Make a landing page with running algorithms.  (This will likely depend on the cache)
5. Disable all the buttons when:
   * pyodide is not loaded
   * a script is already running in pyodide
6. Disable all buttons except "Run":
   * when nothing's been run or 

### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
2. Make more unit tests?
3. Make integration tests?  with Selenium?

### Ready-to-implement TODOs post-launch
4. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
7. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
6. Disallow the user from editing while the animation is running.
6. Disable all buttons except "Run":
   * there's been a doc change since something's been run
   