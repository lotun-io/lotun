#!/usr/bin/env node
import os from 'os';
import chalk from 'chalk';
import { LotunClient } from '@lotun/client';
import program from 'commander';
import latestVersion from 'latest-version';
import { API_URL, WS_URL, DASHBOARD_URL } from './env';
import { LotunConfig } from './utils';

function log(...args: any[]) {
  console.log.apply(
    console,
    // @ts-ignore
    [
      `[ ${new Date()
        .toString()
        .replace(/\(.*\)/, '')
        .trim()} ]`,
    ].concat(args),
  );
}

const pjson = require('../package.json');

program
  .version(pjson.version)
  .option(
    '-c, --config [config]',
    'Full path to lotun config file ex. /home/user/.lotun/config.json',
  );

program.on('--help', function() {
  console.log('');
  console.log('Environment Variables:');
  console.log(
    '  LOTUN_CONFIG_PATH   -  Full path to lotun config file ex. /home/user/.lotun/config.json',
  );
  console.log(
    '  LOTUN_DEVICE_TOKEN  -  Use device token directly, instead reading it from config path',
  );
});

program.parse(process.argv);

async function main() {
  latestVersion('@lotun/cli')
    .then(lotunCliVersion => {
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

  const opts = program.opts() as { version: string; config: string };

  let configPath = opts.config;

  if (!configPath && process.env.LOTUN_CONFIG_PATH) {
    configPath = process.env.LOTUN_CONFIG_PATH;
  }

  const lotunConfig = new LotunConfig({ configPath });
  const config = await lotunConfig.readConfig();

  let deviceToken: string = '';

  if (process.env.LOTUN_DEVICE_TOKEN) {
    deviceToken = process.env.LOTUN_DEVICE_TOKEN;
  }

  if (config && config.deviceToken && !deviceToken) {
    deviceToken = config.deviceToken;
  }

  const lotun = new LotunClient({
    apiUrl: API_URL,
    wsUrl: WS_URL,
  });

  if (!deviceToken) {
    // Generate and store token
    deviceToken = await lotun.generateDeviceToken();
    await lotunConfig.saveConfig({ deviceToken });
  }

  lotun.connect({
    deviceToken,
  });

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
      const encodedToken = encodeURIComponent(deviceToken!);
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
      log(chalk.redBright('Device token is invalid :('));
      return;
    }

    log(chalk.redBright(`Error code: ${reason}`));
  });
}

main().catch(console.error);
