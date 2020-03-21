import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { getDefaultConfigPath } from '@lotun/client';

type LotunConfigObject = {
  deviceToken: string;
};

export class LotunConfig {
  private configPath: string;
  private configDir: string;
  constructor(options: { configPath?: string }) {
    let { configPath } = options;

    if (!configPath) {
      configPath = getDefaultConfigPath();
    }
    this.configPath = configPath;
    this.configDir = path.dirname(configPath);
  }

  async readConfig() {
    try {
      const configBuffer = await promisify(fs.readFile)(this.configPath);
      return JSON.parse(configBuffer.toString()) as LotunConfigObject;
    } catch (err) {
      return null;
    }
  }

  async saveConfig(config: LotunConfigObject) {
    await promisify(fs.mkdir)(this.configDir, { recursive: true });
    return promisify(fs.writeFile)(this.configPath, JSON.stringify(config));
  }
}

function timestamp(...args: any[]) {
  return [
    `[${new Date()
      .toString()
      .replace(/\(.*\)/, '')
      .trim()}]`,
  ].concat(args);
}

export function log(...args: any[]) {
  // @ts-ignore
  console.log.apply(console, timestamp(...args));
}

export function error(...args: any[]) {
  // @ts-ignore
  console.error.apply(console, timestamp(...args));
}
