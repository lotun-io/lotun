"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const client_1 = require("@lotun/client");
const cli_1 = require("@lotun/cli");
const constants_1 = require("./constants");
const helpers_1 = require("./helpers");
const menu_1 = require("./menu");
let configPath;
let deviceToken = '';
if (process.env.LOTUN_CONFIG_PATH) {
    configPath = process.env.LOTUN_CONFIG_PATH;
}
if (process.env.LOTUN_DEVICE_TOKEN) {
    deviceToken = process.env.LOTUN_DEVICE_TOKEN;
}
electron_updater_1.autoUpdater.autoDownload = false;
let tray;
const DEFAULT_CONTEXT_MENU = menu_1.getDefaultContextMenu({
    dashboardUrl: cli_1.DASHBOARD_URL,
});
electron_1.app.on('ready', async () => {
    console.log('ready');
    tray = new electron_1.Tray(constants_1.trayIcons.BASE_ICON);
    tray.setPressedImage(constants_1.trayIcons.BASE_ICON_PRESSED);
    tray.setContextMenu(electron_1.Menu.buildFromTemplate(DEFAULT_CONTEXT_MENU));
    const lotunConfig = new cli_1.LotunConfig({ configPath });
    const config = await lotunConfig.readConfig();
    if (config && config.deviceToken && !deviceToken) {
        deviceToken = config.deviceToken;
    }
    const lotun = new client_1.LotunClient({
        apiUrl: cli_1.API_URL,
        wsUrl: cli_1.WS_URL,
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
        const contextMenu = [
            {
                label: 'Device connected',
                enabled: false,
            },
            ...DEFAULT_CONTEXT_MENU,
        ];
        tray.setContextMenu(electron_1.Menu.buildFromTemplate(contextMenu));
        tray.setImage(constants_1.trayIcons.ONLINE_ICON);
        tray.setPressedImage(constants_1.trayIcons.ONLINE_ICON_PRESSED);
    });
    lotun.on('disconnect', (reason, repeating) => {
        console.log('DISCONNECT', reason);
        if (repeating) {
            return;
        }
        if (reason === 'UNPAIRED_DEVICE_TOKEN') {
            const contextMenu = [
                {
                    label: 'Pair new device',
                    click: () => helpers_1.openPairURL(deviceToken, cli_1.DASHBOARD_URL),
                },
                ...DEFAULT_CONTEXT_MENU,
            ];
            tray.setContextMenu(electron_1.Menu.buildFromTemplate(contextMenu));
            tray.setImage(constants_1.trayIcons.WARNING_ICON);
            tray.setPressedImage(constants_1.trayIcons.WARNING_ICON_PRESSED);
            const notification = new electron_1.Notification({
                title: 'Pair new device',
                body: 'Click here to pair your device with lotun.io',
            });
            notification.show();
            notification.on('click', () => helpers_1.openPairURL(deviceToken, cli_1.DASHBOARD_URL));
        }
        else {
            tray.setImage(constants_1.trayIcons.OFFLINE_ICON);
            tray.setPressedImage(constants_1.trayIcons.OFFLINE_ICON_PRESSED);
        }
    });
});
/*
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
      accessibleTitle: 'Install Updates',

      message: 'Updates downloaded, application will be quit for update...',
    },
    () => {
      setImmediate(() => autoUpdater.quitAndInstall());
    },
  );
});

autoUpdater.on('error', error => {
  dialog.showErrorBox(
    'Error: ',
    error == null ? 'unknown' : (error.stack || error).toString(),
  );
});
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQWlFO0FBQ2pFLHVEQUErQztBQUMvQywwQ0FBNEM7QUFDNUMsb0NBQXlFO0FBQ3pFLDJDQUF3QztBQUN4Qyx1Q0FBa0Q7QUFDbEQsaUNBQStDO0FBRS9DLElBQUksVUFBOEIsQ0FBQztBQUNuQyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFFckIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFO0lBQ2pDLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0NBQzVDO0FBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFO0lBQ2xDLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDO0NBQzlDO0FBRUQsOEJBQVcsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRWpDLElBQUksSUFBVSxDQUFDO0FBQ2YsTUFBTSxvQkFBb0IsR0FBRyw0QkFBcUIsQ0FBQztJQUNqRCxZQUFZLEVBQUUsbUJBQWE7Q0FDNUIsQ0FBQyxDQUFDO0FBRUgsY0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJLEVBQUU7SUFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUVyQixJQUFJLEdBQUcsSUFBSSxlQUFJLENBQUMscUJBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNyQyxJQUFJLENBQUMsZUFBZSxDQUFDLHFCQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztJQUNsRCxJQUFJLENBQUMsY0FBYyxDQUFDLGVBQUksQ0FBQyxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFFbEUsTUFBTSxXQUFXLEdBQUcsSUFBSSxpQkFBVyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztJ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