### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
2. some of the TODOs in the code (need to clarify which ones)
3. figure out how to deploy
4. decide whether to make the run_script safe/secure enough or just take this out altogether. For now I have just removed it altogether.

### Ready-to-implement TODOs pre-launch

1. Write basic manual tests.
   1. Add the ability to load public/published Algos
2. Fill in Header and Footer content
3. Do error highlighting. Sometimes this will be the wrong line -- when it's a syntax error, it says line 0 for some reason.
4. Fix ScriptDemo bug -- not showing Gaussian demo
5. Fix viz log; everything ends up on one line

### Ready-to-implement TODOs post-launch
1. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
2. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
3. Disallow the user from editing while the animation is running.
4. Disable all buttons except "Run":
   * there's been a doc change since something's been run
5. some of the TODOs in the code (need to clarify which ones)
