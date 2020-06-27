import npm from 'global-npm';
import util from 'util';
import { ChildMessage } from './npm-commands';

const npmLoad = util.promisify(npm.load);
const npmInstall = util.promisify(npm.commands.install);
const npmBuild = util.promisify(npm.commands.build);

process.on('message', async ({ type, data }: ChildMessage) => {
  if (!process.send) {
    throw new Error('process.send is undefined');
  }

  if (type === 'install') {
    // @ts-ignore
    await npmLoad(data.npmLoadOpts);

    try {
      await npmInstall([]);
      process.send({ type: 'success' });
    } catch (err) {
      process.send({ type: 'error', data: err.message });
    }

    return;
  }

  if (type === 'build') {
    // @ts-ignore
    await npmLoad(data.npmLoadOpts);

    try {
      await npmBuild([]);
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
