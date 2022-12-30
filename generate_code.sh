#!/bin/bash
set -e 
set -o pipefail

rm -rf generated/*
pnpm run tsc --build tsconfig-generator.json
node generator/ts-out/generator/gen_code.js 
