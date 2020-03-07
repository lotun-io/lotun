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

/*

let argv: any = {};
if (process.argv) {
  argv = minimist(process.argv.slice(2));
}


let stage: 'devel' | 'stage' | undefined;

if (process.env.LOTUN_ENV) {
  stage = <'devel' | 'stage'>process.env.LOTUN_ENV;
}

const lotunClient = new LotunClient(stage);
const { log, error } = console;

let config: string;
let lastError: string;



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
    const configDir = path.dirname(config);
    fs.mkdirSync(configDir, { recursive: true });
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

  lotunClient.setDeviceToken(deviceToken);
  lotunClient.on('connect', () => {
    log(
      chalk.greenBright('Device connected, setup your device from Dashboard:'),
    );
    log(chalk.underline(`${lotunClient.dashboardUrl}`));
  });

  lotunClient.on('error', () => {
    // console.error(err);
  });

  lotunClient.on('close', (code, reason) => {
    if (reason === errorCodes.DEVICE_TOKEN_UNPAIRED && lastError !== reason) {
      const encodedToken = encodeURIComponent(deviceToken);
      const encodedHostname = encodeURIComponent(os.hostname());
      log(
        chalk.redBright(
          'Device is not yet paried to account, please pair your device by click on following link:',
        ),
      );
      log(
        `${
          lotunClient.dashboardUrl
        }/devices/new?token=${encodedToken}&name=${encodedHostname}`,
      );
    }
    if (reason === errorCodes.DEVICE_TOKEN_INVALID && lastError !== reason) {
      log(chalk.redBright('Your device token is invalid.'));
    }

    lastError = reason;
  });

  lotunClient.connect();
}

main().catch(error);
*/
