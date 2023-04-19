### Ready-to-implement TODOs

4. Support running server-side in a sandboxed manner
5. Support caching the results (once running server-side is implemented)
6. Make a landing page with running algorithms.  (This will likely depend on the cache)
10. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
12. Disable all the buttons when:
    * pyodide is not loaded
    * a script is already running in pyodide
12b. Disable all buttons except "Run" when nothing's been run or there's been a doc change since something's been run
13. Disallow the user from editing while the animation is running.
14. Allow the user to cancel a running script
    * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough

### Planning TODOs
2. Decide which other login ID providers to support and make TODO items for those.
3. Make unit tests?  with vite-test?
4. Make integration tests?  with Selenium?
