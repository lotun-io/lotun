const fs = require('fs');
const { app, Tray, Menu, Notification, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const LotunClient = require('@lotun/client');
const { trayIcons, LOTUN_FILE } = require('./constants');
const { readFile, openPairURL } = require('./helpers');
const { DEFAULT_CONTEXT_MENU } = require('./menu');

let tray;
let token;
let lastError;

autoUpdater.autoDownload = false;

const client = LotunClient.create();

app.on('ready', async () => {
  tray = new Tray(trayIcons.BASE_ICON);
  tray.setPressedImage(trayIcons.BASE_ICON_PRESSED);
  tray.setContextMenu(Menu.buildFromTemplate([...DEFAULT_CONTEXT_MENU]));

  try {
    const tokenFile = await readFile(LOTUN_FILE);
    token = JSON.parse(tokenFile.toString()).deviceToken;
    client.setDeviceToken(token);
  } catch (e) {
    token = await client.getNewDeviceToken();
    const data = { deviceToken: token };
    fs.writeFileSync(LOTUN_FILE, JSON.stringify(data));
    client.setDeviceToken(token);
  } finally {
    client.connect();
  }
});

client.on('closeReason', message => {
  if (message.code === 'DEVICE_TOKEN_UNPAIRED' && lastError !== message.code) {
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
  }
  lastError = message.code;
});

client.on('close', () => {
  if (lastError !== 'DEVICE_TOKEN_UNPAIRED') {
    tray.setImage(trayIcons.OFFLINE_ICON);
    tray.setPressedImage(trayIcons.OFFLINE_ICON_PRESSED);
  }
});

client.on('connected', () => {
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
