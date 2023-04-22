### Ready-to-implement TODOs

1. Support running server-side in a sandboxed manner
2. Support caching the results (once running server-side is implemented)
3. Make a landing page with running algorithms.  (This will likely depend on the cache)
4. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
5. Disable all the buttons when:
   * pyodide is not loaded
   * a script is already running in pyodide
12b. Disable all buttons except "Run" when nothing's been run or there's been a doc change since something's been run
6. Disallow the user from editing while the animation is running.
7. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
8. eliminate the wild inefficiency of simply appending to the log for each new event.  (this could take up too much db space, for one thing)

### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
2. Make unit tests?  with vite-test?
3. Make integration tests?  with Selenium?
