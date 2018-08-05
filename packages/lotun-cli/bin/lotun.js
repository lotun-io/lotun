const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const lotunClient = require('@lotun/client').create();
const argv = require('minimist')(process.argv.slice(2));
/*
  --deviceToken
  -t
  --config
  -c
*/

let config;
let lastError;

const generateDeviceToken = async () => {
  let token = null;
  /* eslint-disable no-await-in-loop */
  while (!token) {
    try {
      token = await lotunClient.getNewDeviceToken();
    } catch (err) {
      console.log(err);
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
  const configDir = path.dirname(config);
  console.log(`Config path: ${config}`);
  try {
    data = fs.readFileSync(config);
    try {
      data = JSON.parse(data);
    } catch (err) {
      console.error(err);
      throw new Error(`Cannot parse data from config ${config}`);
    }
  } catch (err) {
    // file not exists, create file and fetch token
    console.log('Generate new device token');
    const deviceToken = await generateDeviceToken();

    data = {
      deviceToken,
    };

    try {
      mkdirp.sync(configDir);
      fs.writeFileSync(config, JSON.stringify(data));
    } catch (e) {
      console.error(e);
      throw new Error(`Cannot write to config ${config}`);
    }
  }
  if (!data || !data.deviceToken) {
    throw new Error(`Cannot read from config ${config} bad format`);
  }
  return data.deviceToken;
};

(async () => {
  try {
    if (argv.c || argv.config) {
      config = path.normalize(argv.c || argv.config);
    } else {
      config = path.join(os.homedir(), '.lotun', 'config.json');
    }
    let deviceToken = null;
    if (argv.t || argv.deviceToken) {
      deviceToken = argv.t || argv.deviceToken;
    } else {
      deviceToken = await getDeviceToken();
    }
    lotunClient.setDeviceToken(deviceToken);
    lotunClient.on('connected', () => {
      console.log('Device connected, setup your device from web app');
      console.log('https://dashboard.dev.lotun.io');
    });

    lotunClient.on('closeReason', message => {
      console.log('closeReason', message);
      if (message.code === 'DEVICE_TOKEN_UNPAIRED' && lastError !== message) {
        console.log('Device not paried to account, please pair your device at this url');
        console.log(
          `https://dashboard.dev.lotun.io/devices/new?token=${encodeURIComponent(
            deviceToken,
          )}&name=${encodeURIComponent(os.hostname())}`,
        );
      }

      lastError = message;
    });

    lotunClient.on('error', () => {});

    lotunClient.on('close', () => {
      console.log('Disconnect');
    });

    lotunClient.connect();
  } catch (err) {
    console.error(err);
  }
})();
