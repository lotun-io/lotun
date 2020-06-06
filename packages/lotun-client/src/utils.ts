import Debug from 'debug';
import path from 'path';
import os from 'os';

export const debug = Debug('@lotun/client');

export function getDefaultConfigPath() {
  return path.join(os.homedir(), '.lotun', 'config.json');
}
