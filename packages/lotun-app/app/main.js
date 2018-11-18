const fs = require('fs');
const path = require('path');
const { app, Tray, Menu, Notification, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const { client, errorCodes } = require('@lotun/client');
const { trayIcons, LOTUN_FILE, LOTUN_DIR } = require('./constants');
const { readFile, openPairURL } = require('./helpers');
const { DEFAULT_CONTEXT_MENU } = require('./menu');

let tray;
let token;
let lastError;

autoUpdater.autoDownload = false;

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

const lotunClient = client.create();

app.on('ready', async () => {
  tray = new Tray(trayIcons.BASE_ICON);
  tray.setPressedImage(trayIcons.BASE_ICON_PRESSED);
  tray.setContextMenu(Menu.buildFromTemplate([...DEFAULT_CONTEXT_MENU]));

  try {
    const tokenFile = await readFile(LOTUN_FILE);
    token = JSON.parse(tokenFile.toString()).deviceToken;
    lotunClient.setDeviceToken(token);
  } catch (e) {
    mkDirByPathSync(LOTUN_DIR);
    token = await lotunClient.getNewDeviceToken();
    const data = { deviceToken: token };

    fs.writeFileSync(LOTUN_FILE, JSON.stringify(data));
    lotunClient.setDeviceToken(token);
  } finally {
    lotunClient.connect();
  }
});

lotunClient.on('close', (code, reason) => {
  if (reason === errorCodes.DEVICE_TOKEN_UNPAIRED && lastError !== reason) {
    const contextMenu = [
      {
        label: 'Pair new device',
        click: () => openPairURL(token),
      },
      ...DEFAULT_CONTEXT_MENU,
    ];
    tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
    tray.setImage(trayIcons.WARNING_ICON);
    tray.setPressedImage(trayIcons.WARNING_ICON_PRESSED);
    const notification = new Notification({
      title: 'Pair new device',
      body: 'Click here to pair your device with lotun.io',
    });
    notification.show();
    notification.on('click', () => openPairURL(token));
  } else {
    tray.setImage(trayIcons.OFFLINE_ICON);
    tray.setPressedImage(trayIcons.OFFLINE_ICON_PRESSED);
  }

  lastError = reason;
});

lotunClient.on('connect', () => {
  const contextMenu = [
    {
      label: 'Device connected',
      enabled: false,
    },
    ...DEFAULT_CONTEXT_MENU,
  ];
  tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
  tray.setImage(trayIcons.ONLINE_ICON);
  tray.setPressedImage(trayIcons.ONLINE_ICON_PRESSED);
  lastError = null;
});

lotunClient.on('error', () => {
  // console.error(err);
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(
    {
      type: 'info',
      title: 'Update available',
      message: 'New update is available, do you want to update now?',
      buttons: ['Yes', 'No'],
    },
    buttonIndex => {
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate();
      }
    },
  );
});

autoUpdater.on('update-not-available', () => {
  dialog.showMessageBox({
    title: 'No Updates',
    message: 'Current version is up-to-date.',
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(
    {
      title: 'Install Updates',
      message: 'Updates downloaded, application will be quit for update...',
    },
    () => {
      setImmediate(() => autoUpdater.quitAndInstall());
    },
  );
});

autoUpdater.on('error', error => {
  dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString());
});
