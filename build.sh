#!/bin/bash

set -eo pipefail

pnpm run build
cp -r dist server/main/public/
