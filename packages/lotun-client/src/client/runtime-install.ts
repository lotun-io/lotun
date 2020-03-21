import path from 'path';

if (!process.env.LOTUN_USE_GLOBAL_NPM) {
  // set for global-npm package
  process.env.GLOBAL_NPM_BIN = path.join(
    __dirname,
    '..',
    '..',
    'node_modules',
    '.bin',
    'npm',
  );

  process.env.GLOBAL_NPM_PATH = path.join(
    __dirname,
    '..',
    '..',
    'node_modules',
    'npm',
  );
}

import { npmImportAsync } from 'runtime-npm-install';

export function createNpmImportAsync(
  installPath: string,
  npmInstallToOpts?: Object,
) {
  return function(packages: string[]) {
    return new Promise<unknown[]>(function(resolve, reject) {
      npmImportAsync(packages, installPath, npmInstallToOpts)
        .then(resolve)
        .catch(reject);
    });
  };
}
