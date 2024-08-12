#!/bin/bash

set -eo pipefail

export FLASK_DEBUG=1
export FLASK_APP=main/app.py
export SECRET_KEY=`openssl rand -base64 32`
export GOOGLE_CLOUD_PROJECT=pyalgoviz-test
export PYTHONUNBUFFERED=1
(cd server/ && python -m flask run)
