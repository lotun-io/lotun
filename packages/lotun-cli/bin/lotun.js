const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { client, errorCodes } = require('@lotun/client');
const argv = require('minimist')(process.argv.slice(2));
/*
  --deviceToken
  -t
  --config
  -c
*/

const lotunClient = client.create();
const { log, error } = console;
const LOTUN_URL = 'dashboard.dev.lotun.io';
let config;
let lastError;

const generateDeviceToken = async () => {
  let token = null;
  /* eslint-disable no-await-in-loop */
  while (!token) {
    try {
      token = await lotunClient.getNewDeviceToken();
    } catch (err) {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 5000);
      });
      /* eslint-enable no-await-in-loop */
    }
  }
  return token;
};

const getDeviceToken = async () => {
  let data;
  log(chalk`Reading configuration from {yellow.bold ${config}}\n`);
  try {
    data = fs.readFileSync(config);
    try {
      data = JSON.parse(data);
    } catch (err) {
      error(err);
      throw new Error(`Cannot read data from config ${config}.`);
    }
  } catch (err) {
    // file not exists, create file and fetch token
    log(chalk.bgYellowBright('Generating new device token.\n'));
    const deviceToken = await generateDeviceToken();

    data = {
      deviceToken,
    };

    try {
      fs.writeFileSync(config, JSON.stringify(data));
    } catch (e) {
      error(e);
      throw new Error(`Cannot write to config ${config}`);
    }
  }
  if (!data || !data.deviceToken) {
    throw new Error(chalk.redBright(`Cannot read from config ${config} - corrupted file.`));
  }
  return data.deviceToken;
};

(async () => {
  try {
    if (argv.c || argv.config) {
      config = path.normalize(argv.c || argv.config);
    } else {
      config = path.join(os.homedir(), '.lotun');
    }
    let deviceToken = null;
    if (argv.t || argv.deviceToken) {
      deviceToken = argv.t || argv.deviceToken;
    } else {
      deviceToken = await getDeviceToken();
    }
    lotunClient.setDeviceToken(deviceToken);
    lotunClient.on('connected', () => {
      log(chalk.greenBright('Device connected, setup your device from Dashboard:'));
      log(chalk.underline(`https://${LOTUN_URL}`));
    });

    lotunClient.on('closeReason', message => {
      if (message.code === errorCodes.DEVICE_TOKEN_UNPAIRED && lastError !== message.code) {
        const encodedToken = encodeURIComponent(deviceToken);
        const encodedHostname = encodeURIComponent(os.hostname());
        log(
          chalk.redBright('Device is not yet paried to account, please pair your device by click on following link:'),
        );
        log(`https://${LOTUN_URL}/devices/new?token=${encodedToken}&name=${encodedHostname}`);
      }

      lastError = message.code;
    });

    lotunClient.on('error', () => {});

    lotunClient.on('close', () => {});

    lotunClient.connect();
  } catch (err) {
    error(err);
  }
})();
