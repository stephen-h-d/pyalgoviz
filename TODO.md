### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
2. some of the TODOs in the code (need to clarify which ones)
3. figure out how to deploy
4. decide whether to make the run_script safe/secure enough or just take this out altogether. For now I have just removed it altogether.
5. decide whether and how to make keyboard shortcuts

### Ready-to-implement TODOs pre-launch

1. Write basic manual tests. Test:
   1. the ability to load public/published Algos
   2. the ability to load the user's own Algos
   3. the ability to run a script without auto-play
   4. the ability to run it with auto-play
   5. prev, next, scroll bar
   6. the Save button
   7. the "Save As" button
   8. more stuff...
2. Fill Footer content
3. On the main page script demos:
   1. show the first event, but don't show the rest until the user hovers over the first one.
   2. show the name of the script and the author.
4. If the author display_name is not None, display it instead of email. Allow the user to edit it somewhere.

### Ready-to-implement TODOs post-launch
1. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
2. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
3. Disallow the user from editing while the animation is running.
4. Disable all buttons except "Run":
   * there's been a doc change since something's been run
5. some of the TODOs in the code (need to clarify which ones)
