import os from 'os';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { LotunClient, errorCodes } from '@lotun/client';
import minimist from 'minimist';
import { AnyARecord } from 'dns';

let homeDir = os.homedir();

let argv: any = {};
if (process.argv) {
  argv = minimist(process.argv.slice(2));
}

/*
  --deviceToken
  -t
  --config
  -c
*/

let stage: 'devel' | 'local' | undefined;

if (process.env.LOTUN_STAGE) {
  stage = <'devel' | 'local'>process.env.LOTUN_STAGE;
}

const lotunClient = new LotunClient(stage);
const { log, error } = console;

let config: string;
let lastError: string;

async function generateDeviceToken() {
  let deviceToken = undefined;
  while (!deviceToken) {
    try {
      deviceToken = await lotunClient.generateDeviceToken();
      break;
    } catch (err) {
      console.error(err);
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 5000);
      });
    }
  }
  return deviceToken;
}

async function getDeviceToken() {
  log(chalk`Reading configuration from {yellow.bold ${config}}\n`);

  let data;
  try {
    data = fs.readFileSync(config);
    try {
      data = JSON.parse(data.toString());
      if (!data || !data.deviceToken) {
        chalk.redBright(`Cannot read from config ${config} - corrupted file.`);
        process.exit();
      }
    } catch (err) {
      chalk.redBright(`Cannot read from config ${config} - corrupted file.`);
      process.exit();
    }
  } catch (err) {
    log(chalk.bgYellowBright('Generating new device token.\n'));
    data = {
      deviceToken: await generateDeviceToken(),
    };

    try {
      fs.writeFileSync(config, JSON.stringify(data));
    } catch (e) {
      error(e);
      chalk.redBright(`Cannot write to config ${config}`);
      process.exit();
    }
  }

  return data.deviceToken;
}

async function main() {
  if (argv.c || argv.config) {
    config = path.normalize(argv.c || argv.config);
  } else {
    const configDir = path.join(homeDir, '.lotun');
    let configFile = 'config.json';
    if (process.env.NODE_ENV === 'devel') {
      configFile = 'devel-config.json';
    }
    fs.mkdirSync(configDir, { recursive: true });
    config = path.join(configDir, configFile);
  }

  let deviceToken: string;
  if (argv.t || argv.deviceToken) {
    deviceToken = argv.t || argv.deviceToken;
  } else {
    deviceToken = await getDeviceToken();
  }

  console.log(deviceToken);
  lotunClient.setDeviceToken(deviceToken);
  lotunClient.on('connect', () => {
    log(chalk.greenBright('Device connected, setup your device from Dashboard:'));
    log(chalk.underline(`${lotunClient.dashboardUrl}`));
  });

  lotunClient.on('error', () => {
    // console.error(err);
  });

  lotunClient.on('close', (code, reason) => {
    if (reason === errorCodes.DEVICE_TOKEN_UNPAIRED && lastError !== reason) {
      const encodedToken = encodeURIComponent(deviceToken);
      const encodedHostname = encodeURIComponent(os.hostname());
      log(chalk.redBright('Device is not yet paried to account, please pair your device by click on following link:'));
      log(`${lotunClient.dashboardUrl}/devices/new?token=${encodedToken}&name=${encodedHostname}`);
    }
    if (reason === errorCodes.DEVICE_TOKEN_INVALID && lastError !== reason) {
      log(chalk.redBright('Your device token is invalid.'));
    }

    lastError = reason;
  });

  lotunClient.connect();
}

main().catch(error);
