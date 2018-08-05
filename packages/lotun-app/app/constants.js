const path = require('path');
const { nativeImage, app } = require('electron');

const trayIcons = {
  BASE_ICON: nativeImage.createFromPath(path.resolve(process.resourcesPath, './assets/icons/tray-icon-base.png')),
  BASE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(process.resourcesPath, './assets/icons/tray-icon-base-pressed.png'),
  ),
  ONLINE_ICON: nativeImage.createFromPath(path.resolve(process.resourcesPath, './assets/icons/tray-icon-online.png')),
  ONLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(process.resourcesPath, './assets/icons/tray-icon-online-pressed.png'),
  ),
  OFFLINE_ICON: nativeImage.createFromPath(path.resolve(process.resourcesPath, './assets/icons/tray-icon-offline.png')),
  OFFLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(process.resourcesPath, './assets/icons/tray-icon-offline-pressed.png'),
  ),
  WARNING_ICON: nativeImage.createFromPath(path.resolve(process.resourcesPath, './assets/icons/tray-icon-warning.png')),
  WARNING_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(process.resourcesPath, './assets/icons/tray-icon-warning-pressed.png'),
  ),
};
const LOTUN_FILE = path.resolve(app.getPath('home'), '.lotun');
const LOTUN_URL = process.env.LOTUN_URL || 'lotun.io';

module.exports = {
  trayIcons,
  LOTUN_FILE,
  LOTUN_URL,
};
