### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
4. some of the TODOs in the code (need to clarify which ones)
5. figure out how to deploy

### Ready-to-implement TODOs pre-launch

1. log out user when token expired (currently shows as logged in even though the token fails)
2. Write basic manual tests.
3. Fill in Header and Footer content
4. Add the ability to load public/published Algos
5. fix line highlighting when running. This was working...

### Ready-to-implement TODOs post-launch
1. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
2. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
3. Disallow the user from editing while the animation is running.
4. Disable all buttons except "Run":
   * there's been a doc change since something's been run
5. some of the TODOs in the code (need to clarify which ones)
