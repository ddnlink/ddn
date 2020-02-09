#!/usr/bin/env bash

yarn 
yarn bootstrap
yarn build
cd packages/ddn
yarn link
cd ../..
