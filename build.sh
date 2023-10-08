#!/bin/bash

set -eo pipefail

pnpm run build
cp -r dist server/main/public/

if [[ "$1" == "-d" ]]; then
  gcloud run deploy pyalgoviz-server --source server --allow-unauthenticated --set-env-vars USE_GOOGLE_DB=True
fi
