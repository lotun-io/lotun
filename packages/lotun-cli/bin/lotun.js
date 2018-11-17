const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { client, errorCodes } = require('@lotun/client');
const minimist = require('minimist');

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') {
        // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') {
        // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || (caughtErr && curDir === path.resolve(targetDir))) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}

let homeDir = process.env.HOME;
if (os.homedir) {
  homeDir = os.homedir();
}

let argv = {};
if (process.argv) {
  argv = minimist(process.argv.slice(2));
}

/*
  --deviceToken
  -t
  --config
  -c
*/

const lotunClient = client.create();
const { log, error } = console;
const LOTUN_URL = null;
if (process.env.NODE_ENV === 'devel') {
  LOTUN_URL = 'dashboard.dev.lotun.io';
} else {
  LOTUN_URL = 'dashboard.lotun.io';
}

let config;
let lastError;

const generateDeviceToken = () =>
  // @TODO attempt limit
  new Promise(resolve => {
    function attempt() {
      lotunClient
        .getNewDeviceToken()
        .then(deviceToken => {
          resolve(deviceToken);
        })
        .catch(() => {
          setTimeout(() => {
            attempt();
          }, 5000);
        });
    }
    attempt();
  });

const getDeviceToken = () =>
  new Promise((resolve, reject) => {
    let data;
    log(chalk`Reading configuration from {yellow.bold ${config}}\n`);
    try {
      data = fs.readFileSync(config);
      try {
        data = JSON.parse(data);
        if (!data || !data.deviceToken) {
          reject(chalk.redBright(`Cannot read from config ${config} - corrupted file.`));
        }
        resolve(data);
      } catch (err) {
        error(err);
        reject(new Error(`Cannot read data from config ${config}.`));
      }
    } catch (err) {
      // file not exists, create file and fetch token
      log(chalk.bgYellowBright('Generating new device token.\n'));
      generateDeviceToken().then(deviceToken => {
        data = {
          deviceToken,
        };

        try {
          fs.writeFileSync(config, JSON.stringify(data));
          resolve(data);
        } catch (e) {
          error(e);
          reject(new Error(`Cannot write to config ${config}`));
        }
      });
    }
  }).then(data => data.deviceToken);

new Promise((resolve, reject) => {
  if (argv.c || argv.config) {
    config = path.normalize(argv.c || argv.config);
  } else {
    const configDir = path.join(homeDir, '.lotun');
    mkDirByPathSync(configDir);
    config = path.join(configDir, 'config.json');
  }
  let deviceToken = null;
  if (argv.t || argv.deviceToken) {
    deviceToken = argv.t || argv.deviceToken;
    resolve(deviceToken);
  } else {
    getDeviceToken()
      .then(resolve)
      .catch(reject);
  }
})
  .then(deviceToken => {
    lotunClient.setDeviceToken(deviceToken);
    lotunClient.on('connect', () => {
      log(chalk.greenBright('Device connected, setup your device from Dashboard:'));
      log(chalk.underline(`https://${LOTUN_URL}`));
    });

    lotunClient.on('error', () => {
      // console.error(err);
    });

    lotunClient.on('close', (code, reason) => {
      if (reason === errorCodes.DEVICE_TOKEN_UNPAIRED && lastError !== reason) {
        const encodedToken = encodeURIComponent(deviceToken);
        const encodedHostname = encodeURIComponent(os.hostname());
        log(
          chalk.redBright('Device is not yet paried to account, please pair your device by click on following link:'),
        );
        log(`https://${LOTUN_URL}/devices/new?token=${encodedToken}&name=${encodedHostname}`);
      }
      if (reason === errorCodes.DEVICE_TOKEN_INVALID && lastError !== reason) {
        log(chalk.redBright('Your device token is invalid.'));
      }

      lastError = reason;
    });

    lotunClient.connect();
  })
  .catch(err => {
    error(err);
  });
