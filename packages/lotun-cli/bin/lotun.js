"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const client_1 = require("@lotun/client");
const minimist_1 = __importDefault(require("minimist"));
let homeDir = os_1.default.homedir();
let argv = {};
if (process.argv) {
    argv = minimist_1.default(process.argv.slice(2));
}
/*
  --deviceToken
  -t
  --config
  -c
*/
let stage;
if (process.env.LOTUN_ENV) {
    stage = process.env.LOTUN_ENV;
}
const lotunClient = new client_1.LotunClient(stage);
const { log, error } = console;
let config;
let lastError;
async function generateDeviceToken() {
    let deviceToken = undefined;
    while (!deviceToken) {
        try {
            deviceToken = await lotunClient.generateDeviceToken();
            break;
        }
        catch (err) {
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
    log(chalk_1.default `Reading configuration from {yellow.bold ${config}}\n`);
    let data;
    try {
        data = fs_1.default.readFileSync(config);
        try {
            data = JSON.parse(data.toString());
            if (!data || !data.deviceToken) {
                chalk_1.default.redBright(`Cannot read from config ${config} - corrupted file.`);
                process.exit();
            }
        }
        catch (err) {
            chalk_1.default.redBright(`Cannot read from config ${config} - corrupted file.`);
            process.exit();
        }
    }
    catch (err) {
        log(chalk_1.default.bgYellowBright('Generating new device token.\n'));
        data = {
            deviceToken: await generateDeviceToken(),
        };
        try {
            fs_1.default.writeFileSync(config, JSON.stringify(data));
        }
        catch (e) {
            error(e);
            chalk_1.default.redBright(`Cannot write to config ${config}`);
            process.exit();
        }
    }
    return data.deviceToken;
}
async function main() {
    if (argv.c || argv.config) {
        config = path_1.default.normalize(argv.c || argv.config);
        const configDir = path_1.default.dirname(config);
        fs_1.default.mkdirSync(configDir, { recursive: true });
    }
    else {
        const configDir = path_1.default.join(homeDir, '.lotun');
        let configFile = 'config.json';
        if (process.env.NODE_ENV === 'devel') {
            configFile = 'devel-config.json';
        }
        fs_1.default.mkdirSync(configDir, { recursive: true });
        config = path_1.default.join(configDir, configFile);
    }
    let deviceToken;
    if (argv.t || argv.deviceToken) {
        deviceToken = argv.t || argv.deviceToken;
    }
    else {
        deviceToken = await getDeviceToken();
    }
    lotunClient.setDeviceToken(deviceToken);
    lotunClient.on('connect', () => {
        log(chalk_1.default.greenBright('Device connected, setup your device from Dashboard:'));
        log(chalk_1.default.underline(`${lotunClient.dashboardUrl}`));
    });
    lotunClient.on('error', () => {
        // console.error(err);
    });
    lotunClient.on('close', (code, reason) => {
        if (reason === client_1.errorCodes.DEVICE_TOKEN_UNPAIRED && lastError !== reason) {
            const encodedToken = encodeURIComponent(deviceToken);
            const encodedHostname = encodeURIComponent(os_1.default.hostname());
            log(chalk_1.default.redBright('Device is not yet paried to account, please pair your device by click on following link:'));
            log(`${lotunClient.dashboardUrl}/devices/new?token=${encodedToken}&name=${encodedHostname}`);
        }
        if (reason === client_1.errorCodes.DEVICE_TOKEN_INVALID && lastError !== reason) {
            log(chalk_1.default.redBright('Your device token is invalid.'));
        }
        lastError = reason;
    });
    lotunClient.connect();
}
main().catch(error);
//# sourceMappingURL=lotun.js.map