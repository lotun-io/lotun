#!/bin/bash
function cleanup {
  bin/client-bundle-dependencies-clean.ts 
}

trap cleanup EXIT

bin/client-bundle-dependencies-clean.ts && 
npx lerna exec --scope @lotun/api --scope @lotun/client -- rm -rf node_modules &&
npx lerna bootstrap --scope @lotun/api --scope @lotun/client &&
bin/client-bundle-dependencies.ts && 
npm run build &&
if [[ -n $PUBLISH ]]; then
  npx lerna exec --scope @lotun/client -- npm version patch &&
  npx lerna exec --scope @lotun/client -- npm publish --scope public
fi
