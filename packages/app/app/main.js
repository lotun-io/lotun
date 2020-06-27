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
    tray = new electron_1.Tray(constants_1.trayIcons.BASE_ICON);
    tray.setPressedImage(constants_1.trayIcons.BASE_ICON_PRESSED);
    tray.setContextMenu(electron_1.Menu.buildFromTemplate(DEFAULT_CONTEXT_MENU));
    const lotunConfig = new cli_1.LotunConfig({ configPath });
    const config = await lotunConfig.readConfig();
    if (config && config.deviceToken && !deviceToken) {
        deviceToken = config.deviceToken;
    }
    const lotun = new client_1.LotunClient({
        configPath,
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
        if (repeating) {
            return;
        }
        console.log('DISCONNECT', reason);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQWlFO0FBQ2pFLHVEQUErQztBQUMvQywwQ0FBNEM7QUFDNUMsb0NBQXlFO0FBQ3pFLDJDQUF3QztBQUN4Qyx1Q0FBa0Q7QUFDbEQsaUNBQStDO0FBRS9DLElBQUksVUFBOEIsQ0FBQztBQUNuQyxJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFFckIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFO0lBQ2pDLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0NBQzVDO0FBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFO0lBQ2xDLFdBQVcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDO0NBQzlDO0FBRUQsOEJBQVcsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRWpDLElBQUksSUFBVSxDQUFDO0FBQ2YsTUFBTSxvQkFBb0IsR0FBRyw0QkFBcUIsQ0FBQztJQUNqRCxZQUFZLEVBQUUsbUJBQWE7Q0FDNUIsQ0FBQyxDQUFDO0FBRUgsY0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxJQUFJLEVBQUU7SUFDekIsSUFBSSxHQUFHLElBQUksZUFBSSxDQUFDLHFCQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBUyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDbEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFJLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBRWxFLE1BQU0sV0FBVyxHQUFHLElBQUksaUJBQVcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDcEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxF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