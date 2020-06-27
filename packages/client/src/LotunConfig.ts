import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { getDefaultConfigPath } from './utils';
import { createLotunApi, LotunApi } from '@lotun/api';

type LotunConfigObject = {
  deviceToken: string;
};

export class LotunConfig {
  configPath: string;
  configDir: string;
  data?: LotunConfigObject;
  constants: {
    API_URL: string;
    DEVICE_TUNNEL_URL: string;
    DASHBOARD_URL: string;
    LOTUN_ENV: string;
  };
  private api!: LotunApi;

  constructor(options: { configPath?: string } = {}) {
    let { configPath } = options;

    if (!configPath) {
      configPath = getDefaultConfigPath();
    }

    this.configPath = configPath;
    this.configDir = path.dirname(configPath);

    this.constants = this.readEnv();

    this.api = createLotunApi({ apiUrl: this.constants.API_URL });
  }

  setConfig(config: LotunConfigObject) {
    this.data = config;
  }

  async readConfig() {
    try {
      const configBuffer = await promisify(fs.readFile)(this.configPath);
      const config = JSON.parse(configBuffer.toString()) as LotunConfigObject;
      this.setConfig(config);
      return config;
    } catch (err) {
      return null;
    }
  }

  async saveConfig(config: LotunConfigObject) {
    await promisify(fs.mkdir)(this.configDir, { recursive: true });
    await promisify(fs.writeFile)(this.configPath, JSON.stringify(config));
    this.setConfig(config);
  }

  async generateDeviceToken() {
    const res = await this.api.generateDeviceToken();
    return res.generateDeviceToken.token;
  }

  private readEnv() {
    let LOTUN_ENV = process.env.LOTUN_ENV || 'production';

    let API_URL = 'https://api.lotun.io/graphql';
    let DEVICE_TUNNEL_URL = 'https://device.lotun.io';
    let DASHBOARD_URL = 'https://dashboard.lotun.io';

    if (LOTUN_ENV === 'stage') {
      API_URL = 'https://api.stage.lotun.io/graphql';
      DEVICE_TUNNEL_URL = 'https://device.stage.lotun.io';
      DASHBOARD_URL = 'https://dashboard.stage.lotun.io';
    }

    if (LOTUN_ENV === 'devel') {
      API_URL = 'https://api.devel.lotun.io/graphql';
      DEVICE_TUNNEL_URL = 'https://device.devel.lotun.io';
      DASHBOARD_URL = 'https://dashboard.devel.lotun.io';
    }

    return {
      API_URL,
      DEVICE_TUNNEL_URL,
      DASHBOARD_URL,
      LOTUN_ENV,
    };
  }
}
