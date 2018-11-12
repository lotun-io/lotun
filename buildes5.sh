#!/bin/bash
rm -rf ./build && \
./node_modules/.bin/babel --config-file ./es5.babelrc ./packages/lotun-cli/ --out-dir ./build --copy-files && \
cd ./build && \
tar -zcvf lotun.0.0.1.tar.gz .