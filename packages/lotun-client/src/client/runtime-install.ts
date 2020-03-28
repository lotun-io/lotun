import path from 'path';

if (!process.env.LOTUN_USE_GLOBAL_NPM) {
  // set for global-npm package
  const nodeModulesPath = path.resolve(require.resolve('npm'), '../../../');

  process.env.GLOBAL_NPM_BIN = path.join(nodeModulesPath, '.bin', 'npm');
  process.env.GLOBAL_NPM_PATH = path.join(nodeModulesPath, 'npm');
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
