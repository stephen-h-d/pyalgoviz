### Planning TODOs
1. Decide which other login ID providers to support and make TODO items for those.
2. Make more unit tests?
3. Make integration tests?  with Selenium?
4. some of the TODOs in the code (need to clarify which ones)
5. figure out how to deploy

### Ready-to-implement TODOs pre-launch

1. Render the first event that actually has something in the demo / landing page
5. Disable all the buttons when: (est. 0.5 hours)
   * pyodide is not loaded
   * a script is already running in pyodide
6. Disable all buttons except "Run": (est. 0.5 hours)
   * when nothing's been run or
7. add option to auto-play (est. 0.5 hours)
9. log out user when token expired (currently shows as logged in even though the token fails)
10. Make a bash script that:
  1. `pnpm run build`
  2. `cp -r dist server/main/public/`
  3. if "-d" argument is passed, for deploy, `(cd server && gcloud run deploy)`


### Ready-to-implement TODOs post-launch
4. Tell the user when Pyodide is loading, when it is done loading, when the code is running, and when it is done running.
7. Allow the user to cancel a running script
   * See https://pyodide.org/en/stable/usage/keyboard-interrupts.html -- seems straightforward enough
6. Disallow the user from editing while the animation is running.
6. Disable all buttons except "Run":
   * there's been a doc change since something's been run
8. some of the TODOs in the code (need to clarify which ones)
