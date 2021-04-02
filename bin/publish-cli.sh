#!/bin/bash
npx lerna exec --scope @lotun/cli -- npm i @lotun/client@latest --save-prod
npm run build &&
if [[ -n $PUBLISH ]]; then
  npx lerna exec --scope @lotun/cli -- npm version patch &&
  npx lerna exec --scope @lotun/cli -- npm publish --scope public 
fi;
