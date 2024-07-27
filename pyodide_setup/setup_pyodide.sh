#!/usr/bin/bash

set -eo pipefail

# This script sets up pyodide for running in a development environment (not sure about deployment yet).
# We have to use a custom webworker.js script, and AFAICT, it has to be in the same folder in the other
# files, because the `importScripts("pyodide.js")` line seems to assume that all of the necessary files
# will be in the same directory as `webworker.js`.

PYODIDE_VERSION="0.21.3"
PYODIDE_DIR="public/pyodide-${PYODIDE_VERSION}"
DOWNLOAD_DIR="${HOME}/Downloads"
PYODIDE_TAR="${DOWNLOAD_DIR}/pyodide-build-${PYODIDE_VERSION}.tar.bz2"
PYODIDE_URL="https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-build-${PYODIDE_VERSION}.tar.bz2"

# Create the necessary directory
mkdir -p "${PYODIDE_DIR}"
# remove any previous contents
rm -rf "${PYODIDE_DIR}/*"

# Download the .tar.bz2 file if it does not already exist
if [ ! -f "${PYODIDE_TAR}" ]; then
    wget -O "${PYODIDE_TAR}" "${PYODIDE_URL}"
fi

# Extract the tar.bz2 file to the current directory (public/pyodide-0.21.3/)
tar -xf "${PYODIDE_TAR}" -C "${PYODIDE_DIR}"

# Copy the custom webworker.js script
cp pyodide_setup/webworker.js "${PYODIDE_DIR}"

echo "Pyodide setup complete."
