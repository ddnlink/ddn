#!/usr/bin/env bash

yarn 
yarn bootstrap
yarn build
cd packages/ddn-cli
yarn link
cd ../..
