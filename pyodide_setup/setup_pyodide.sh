#!/usr/bin/bash

# This script sets up pyodide for running in a development environment (not sure about deployment yet).
# We have to use a custom webworker.js script, and AFAICT, it has to be in the same folder in the other
# files, because the `importScripts("pyodide.js")` line seems to assume that all of the necessary files
# will be in the same directory as `webworker.js`.

mkdir -p public/pyodide-0.21.3/
cd public/pyodide-0.21.3/
wget https://github.com/pyodide/pyodide/releases/download/0.21.3/pyodide-build-0.21.3.tar.bz2
tar -xf pyodide-build-0.21.3.tar.bz2
mv pyodide/* .
rm -rf pyodide pyodide-build-0.21.3.tar.bz2
cp ../../pyodide_setup/webworker.js .
cd ../..
