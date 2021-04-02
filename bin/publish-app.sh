#!/bin/bash
npx lerna exec --scope @lotun/app -- npm i @lotun/client@latest --save-prod && 
npm run build &&
if [[ -n $PUBLISH ]]; then
  echo 'todo'
fi
