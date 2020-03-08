const path = require('path');
const { nativeImage, app } = require('electron');

function getResourcesPath() {
  return process.resourcesPath;
}

const trayIcons = {
  BASE_ICON: nativeImage.createFromPath(path.resolve(getResourcesPath(), './assets/icons/tray-icon-base.png')),
  BASE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-base-pressed.png'),
  ),
  ONLINE_ICON: nativeImage.createFromPath(path.resolve(getResourcesPath(), './assets/icons/tray-icon-online.png')),
  ONLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-online-pressed.png'),
  ),
  OFFLINE_ICON: nativeImage.createFromPath(path.resolve(getResourcesPath(), './assets/icons/tray-icon-offline.png')),
  OFFLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-offline-pressed.png'),
  ),
  WARNING_ICON: nativeImage.createFromPath(path.resolve(getResourcesPath(), './assets/icons/tray-icon-warning.png')),
  WARNING_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), './assets/icons/tray-icon-warning-pressed.png'),
  ),
};

let configFile = 'config.json';

if (process.env && process.env.NODE_ENV && process.env.NODE_ENV === 'devel') {
  configFile = 'devel-config.json';
}

const LOTUN_FILE = path.resolve(app.getPath('home'), '.lotun', configFile);
const LOTUN_DIR = path.resolve(app.getPath('home'), '.lotun');
let LOTUN_URL = 'lotun.io';
if (process.env && process.env.NODE_ENV) {
  if (process.env.NODE_ENV === 'devel') {
    LOTUN_URL = 'dev.lotun.io';
  }
}

module.exports = {
  trayIcons,
  LOTUN_FILE,
  LOTUN_DIR,
  LOTUN_URL,
};
