import npm from 'global-npm';
import util from 'util';
import { ChildMessage } from './npm-commands';

const npmLoad = util.promisify(npm.load);

process.on('message', async ({ type, data }: ChildMessage) => {
  if (!process.send) {
    throw new Error('process.send is undefined');
  }

  if (type === 'install') {
    // @ts-ignore
    await npmLoad(data.npmLoadOpts);
    const npmInstall = util.promisify(npm.commands.install);
    try {
      await npmInstall([]);
      process.send({ type: 'success' });
    } catch (err) {
      process.send({ type: 'error', data: err.message });
    }

    return;
  }

  if (type === 'run-build') {
    // @ts-ignore
    await npmLoad(data.npmLoadOpts);
    const npmRunScript = util.promisify(npm.commands['run-script']);
    try {
      await npmRunScript(['build']);
      process.send({ type: 'success' });
    } catch (err) {
      process.send({ type: 'error', data: err.message });
    }
  }
});

if (!process.send) {
  throw new Error('process.send is undefined');
}

process.send({
  type: 'ready',
});
