#!/bin/bash

set -eo pipefail

export FLASK_DEBUG=0
export FLASK_APP=server/main/app.py
export SECRET_KEY=`openssl rand -base64 32`
export GOOGLE_CLOUD_PROJECT=pyalgoviz-test
export GOOGLE_APPLICATION_CREDENTIALS=$HOME/keys/pyalgoviz-test-e14f2f427b51.json
export PYTHONUNBUFFERED=1
python -m flask run
