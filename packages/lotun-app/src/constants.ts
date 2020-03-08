import path from 'path';
import os from 'os';
import { nativeImage, app } from 'electron';

function getResourcesPath() {
  return process.resourcesPath;
}

export const trayIcons = {
  BASE_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-base.png'),
  ),
  BASE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      './assets/icons/tray-icon-base-pressed.png',
    ),
  ),
  ONLINE_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-online.png'),
  ),
  ONLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      './assets/icons/tray-icon-online-pressed.png',
    ),
  ),
  OFFLINE_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-offline.png'),
  ),
  OFFLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      './assets/icons/tray-icon-offline-pressed.png',
    ),
  ),
  WARNING_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-warning.png'),
  ),
  WARNING_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      './assets/icons/tray-icon-warning-pressed.png',
    ),
  ),
};

let configFile = 'config.json';

if (process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'devel') {
  configFile = 'devel-config.json';
}

export const LOTUN_FILE = path.resolve(
  app.getPath('home'),
  '.lotun',
  configFile,
);

export const LOTUN_DIR = path.resolve(app.getPath('home'), '.lotun');
export let LOTUN_URL = 'lotun.io';

if (process.env.LOTUN_ENV) {
  if (process.env.LOTUN_ENV === 'stage') {
    LOTUN_URL = 'stage.lotun.io';
  }
  if (process.env.LOTUN_ENV === 'devel') {
    LOTUN_URL = 'devel.lotun.io';
  }
}
