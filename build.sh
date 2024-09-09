#!/bin/bash

# This script builds the frontend. If the first argument is "-d", it also deploys the server to Google Cloud Run.
# If you want to run the backend with the built frontend, run this first and then run ./run_backend.sh.
# Then go to localhost:5000 in your browser.

set -eo pipefail

pnpm run build
cp -r dist server/main/public/

if [[ "$1" == "-d" ]]; then
  gcloud run deploy pyalgoviz-server --source . --allow-unauthenticated --set-env-vars USE_GOOGLE_DB=True,SECRET_KEY=$(openssl rand -base64 32) --region us-east4
fi

# to build docker image locally:
# sudo docker build -t pyalgoviz-server .

# To run it locally, make sure USE_GOOGLE_DB is "False" because having it be "True" would require giving the image
# credentials to access the database. Then run:
# sudo docker run -p 8000:8000 pyalgoviz-server
# Then go to localhost:8000 in your browser.
