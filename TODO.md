### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
2. Make more unit tests?
3. Make integration tests?  with Selenium?

### Ready-to-implement TODOs

2. Support caching the results (once running server-side is implemented) (est. 2 hrs)
   This appears to be working..?  but needs to actually be tested for real, not just assume
   that no errors means no issues

3. Make a landing page with running algorithms.  (This will likely depend on the cache) (est. 3 hrs)
5. Disable all the buttons when: (est. 0.5 hours)
   * pyodide is not loaded
   * a script is already running in pyodide
6. Disable all buttons except "Run": (est. 0.5 hours)
   * when nothing's been run or
7. add option to auto-play (est. 0.5 hours)
8. some of the TODOs in the code (need to clarify which ones)

### Ready-to-implement TODOs post-launch
4. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
7. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
6. Disallow the user from editing while the animation is running.
6. Disable all buttons except "Run":
   * there's been a doc change since something's been run
8. some of the TODOs in the code (need to clarify which ones)
