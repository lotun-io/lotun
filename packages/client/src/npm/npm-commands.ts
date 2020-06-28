import { fork, ForkOptions } from 'child_process';
import path from 'path';
import npm from 'npm';

export type ChildMessage = {
  type: 'ready' | 'install' | 'run-build' | 'success' | 'error';
  data: any;
};

export type NpmLoadOpts = Parameters<typeof npm.load>[0];

const defaultNpmLoadOpts = {
  progress: false,
  loglevel: 'silent',
};

if (!process.env.LOTUN_USE_GLOBAL_NPM) {
  // set for global-npm package
  const nodeModulesPath = path.resolve(
    require.resolve('npm'),
    '..',
    '..',
    '..',
  );

  process.env.GLOBAL_NPM_BIN = path.join(nodeModulesPath, '.bin', 'npm');
  process.env.GLOBAL_NPM_PATH = path.join(nodeModulesPath, 'npm');
}

export const npmInstall = (
  forkOptions: ForkOptions,
  npmLoadOpts: NpmLoadOpts = {},
) => {
  return new Promise<string>((resolve, reject) => {
    const child = fork(path.join(__dirname, 'npm-commands-child.js'), [], {
      silent: true,
      ...forkOptions,
    });

    let output = '';
    child.stdout?.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr?.pipe(process.stderr);
    child.on('message', ({ type, data }: ChildMessage) => {
      if (type === 'ready') {
        let childMessage: ChildMessage = {
          type: 'install',
          data: { npmLoadOpts: { ...defaultNpmLoadOpts, ...npmLoadOpts } },
        };
        child.send(childMessage);
      } else if (type === 'success') {
        resolve(output.trim());
        child.kill();
      } else if (type === 'error') {
        reject(new Error(data));
        child.kill();
      }
    });
  });
};

export const npmRunBuild = (
  forkOptions: ForkOptions,
  npmLoadOpts: NpmLoadOpts = {},
) => {
  return new Promise<string>((resolve, reject) => {
    const child = fork(path.join(__dirname, 'npm-commands-child.js'), [], {
      silent: true,
      ...forkOptions,
    });

    let output = '';
    child.stdout?.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr?.pipe(process.stderr);
    child.on('message', ({ type, data }: ChildMessage) => {
      if (type === 'ready') {
        let childMessage: ChildMessage = {
          type: 'run-build',
          data: { npmLoadOpts: { ...defaultNpmLoadOpts, ...npmLoadOpts } },
        };
        child.send(childMessage);
      } else if (type === 'success') {
        resolve(output.trim());
        child.kill();
      } else if (type === 'error') {
        reject(new Error(data));
        child.kill();
      }
    });
  });
};
