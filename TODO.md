### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
4. some of the TODOs in the code (need to clarify which ones)
5. figure out how to deploy

### Ready-to-implement TODOs pre-launch

1. Disable all the buttons when: (est. 0.5 hours)
   * pyodide is not loaded
   * a script is already running in pyodide
2. Disable all buttons except "Run": (est. 0.5 hours)
   * when nothing's been run or
3. add option to auto-play (est. 0.5 hours)
4. log out user when token expired (currently shows as logged in even though the token fails)
5. add a "save" vs. "save as" distinction (as opposed to effectively always "saving as")
6. use play/pause/next/prev icons, not text
7. Write basic manual tests.
8. Fill in Header and Footer content
9. Add the ability to load public/published Algos

### Ready-to-implement TODOs post-launch
1. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
2. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
3. Disallow the user from editing while the animation is running.
4. Disable all buttons except "Run":
   * there's been a doc change since something's been run
5. some of the TODOs in the code (need to clarify which ones)
