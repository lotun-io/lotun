#!/usr/bin/env node
import os from 'os';
import chalk from 'chalk';
import { LotunClient } from '@lotun/client';
import program from 'commander';
import { API_URL, WS_URL, DASHBOARD_URL } from './env';
import { LotunConfig } from './utils';

const pjson = require('../package.json');

program
  .version(pjson.version)
  .option(
    '-c, --config [config]',
    'Full path to lotun config file ex. /home/user/.lotun/config.json',
  );

program.parse(process.argv);

async function main() {
  const opts = program.opts() as { version: string; config: string };
  const lotunConfig = new LotunConfig({ configPath: opts.config });
  const config = await lotunConfig.readConfig();

  let deviceToken: string = '';
  if (config && config.deviceToken && !deviceToken) {
    deviceToken = config.deviceToken;
  }

  // @ts-ignore
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
    console.log(
      chalk.greenBright('Device connected, setup your device from Dashboard:'),
    );
    console.log(chalk.underline(`${DASHBOARD_URL}`));
  });

  lotun.on('disconnect', (reason, repeating) => {
    if (repeating) {
      return;
    }

    if (reason === 'UNPAIRED_DEVICE_TOKEN') {
      const encodedToken = encodeURIComponent(deviceToken!);
      const encodedHostname = encodeURIComponent(os.hostname());
      console.log(
        chalk.redBright(
          'Device is not yet paried to your account, please pair your device by click on following link:',
        ),
      );
      console.log(
        `${DASHBOARD_URL}/devices/new?token=${encodedToken}&name=${encodedHostname}`,
      );
    }
    if (reason === 'INVALID_DEVICE_TOKEN') {
      console.log(chalk.redBright('Device token is invalid :('));
    }
  });
}

main().catch(console.error);
