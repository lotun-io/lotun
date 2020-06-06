#!/usr/bin/env node --expose-internals
import { LotunClient, LotunConfig } from '@lotun/client';
import chalk from 'chalk';
import program from 'commander';
import latestVersion from 'latest-version';
import os from 'os';
import 'source-map-support/register';
import { error, log } from './utils';

const pjson = require('../package.json');

program
  .version(pjson.version)
  .option(
    '-c, --config [config]',
    'Full path to lotun config file ex. /home/user/.lotun/config.json',
  );

program.on('--help', function () {
  console.log('');
  console.log('Environment Variables:');
  console.log(
    '  LOTUN_CONFIG_PATH   -  Full path to lotun config file ex. /home/user/.lotun/config.json',
  );
  console.log(
    '  LOTUN_DEVICE_TOKEN  -  Use device token directly, instead reading it from config path',
  );
  console.log(
    '  LOTUN_USE_GLOBAL_NPM  -  Use globally installed npm module instead of local npm moudle',
  );
});

program.parse(process.argv);

async function main() {
  latestVersion(pjson.name)
    .then((lotunCliVersion) => {
      if (lotunCliVersion !== pjson.version) {
        log(
          chalk.yellowBright(`Update available`),
          `${pjson.version}`,
          chalk.yellowBright(`-> ${lotunCliVersion}`),
        );
        log(
          chalk.yellowBright(`Run`),
          chalk.cyanBright(`npm i -g @lotun/cli`),
          chalk.yellowBright(`to update`),
        );
      }
    })
    .catch(() => {});

  const opts = program.opts() as { version: string; config?: string };

  let configPath = opts.config;

  if (!configPath && process.env.LOTUN_CONFIG_PATH) {
    configPath = process.env.LOTUN_CONFIG_PATH;
  }

  const config = new LotunConfig({ configPath });
  const { DASHBOARD_URL } = config.constants;

  if (process.env.LOTUN_DEVICE_TOKEN) {
    config.setConfig({
      deviceToken: process.env.LOTUN_DEVICE_TOKEN,
    });
  } else {
    await config.readConfig();
  }

  if (!config.data?.deviceToken) {
    const deviceToken = await config.generateDeviceToken();
    await config.saveConfig({ deviceToken });
  }

  const lotun = new LotunClient(config);
  lotun.connect();

  lotun.on('connect', () => {
    log(
      chalk.greenBright('Device connected, setup your device from Dashboard:'),
    );
    log(chalk.underline(`${DASHBOARD_URL}/`));
  });

  lotun.on('disconnect', (reason, repeating) => {
    if (repeating) {
      return;
    }

    if (reason === 'UNPAIRED_DEVICE_TOKEN') {
      const encodedToken = encodeURIComponent(config.data?.deviceToken!);
      const encodedHostname = encodeURIComponent(os.hostname());
      log(
        chalk.redBright(
          'Device is not yet paried to your account, please pair your device by click on following link:',
        ),
      );
      log(
        chalk.underline(
          `${DASHBOARD_URL}/devices/new?token=${encodedToken}&name=${encodedHostname}`,
        ),
      );
      return;
    }

    if (reason === 'INVALID_DEVICE_TOKEN') {
      error(chalk.redBright('Device token is invalid'));
      return;
    }

    error(chalk.redBright(`Error code: ${reason}`));
  });
}

main();

process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('unhandledRejection', promise, 'reason:', reason);
});
