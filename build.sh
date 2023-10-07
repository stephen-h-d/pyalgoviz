#!/bin/bash

set -eo pipefail

pnpm run build
cp -r dist server/main/public/

if [[ "$1" == "-d" ]]; then
  (cd server && gcloud run deploy)
fi
