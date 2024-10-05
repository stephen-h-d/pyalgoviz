#!/bin/bash

# This script builds the frontend. If the first argument is "-d", it also deploys the server to Google Cloud Run.
# If you want to run the backend with the built frontend, run this first and then run ./run_backend.sh.
# Then go to localhost:5000 in your browser.

set -eo pipefail

echo "Building frontend..."
pnpm run build
cp -r dist server/main/public/

if [[ "$1" == "-d" ]]; then
  echo "Building and deploying server..."
  gcloud run deploy pyalgoviz-server --source . --allow-unauthenticated --set-env-vars USE_GOOGLE_DB=True,SECRET_KEY=$(openssl rand -base64 32) --region us-east4
fi

if [[ "$1" == "-dr" ]]; then
  echo "Building server..."
  image_url="us-east4-docker.pkg.dev/pyalgoviz-test/my-docker-repo/pyalgoviz-server:latest"
  docker build -t $image_url .
  echo "Pushing server..."
  docker push $image_url
  echo "Deploying server..."
  gcloud run deploy pyalgoviz-server \
  --image $image_url \
  --allow-unauthenticated \
  --platform managed \
  --set-env-vars USE_GOOGLE_DB=True,SECRET_KEY=$(openssl rand -base64 32) \
  --region us-east4
  echo "Done!"
fi


# To run it locally, make sure USE_GOOGLE_DB is "False" because having it be "True" would require giving the image
# credentials to access the database. Then run:
# docker run -p 8000:8000 pyalgoviz-server
# Then go to localhost:8000 in your browser.
