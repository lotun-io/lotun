"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const client_1 = require("@lotun/client");
const cli_1 = require("@lotun/cli");
const constants_1 = require("./constants");
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
electron_1.app.on('ready', async () => {
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
        ];
        tray.setContextMenu(electron_1.Menu.buildFromTemplate(contextMenu));
        tray.setImage(constants_1.trayIcons.ONLINE_ICON);
        tray.setPressedImage(constants_1.trayIcons.ONLINE_ICON_PRESSED);
        /*
        log(
          chalk.greenBright('Device connected, setup your device from Dashboard:'),
        );
        log(chalk.underline(`${DASHBOARD_URL}/`));
        */
    });
    lotun.on('disconnect', (reason, repeating) => {
        if (repeating) {
            return;
        }
        if (reason === 'UNPAIRED_DEVICE_TOKEN') {
            /*
            const encodedToken = encodeURIComponent(deviceToken!);
            const encodedHostname = encodeURIComponent(os.hostname());
            log(
              chalk.redBright(
                'Device is not yet paried to your account, please pair your device by click on following link:',
              ),
            );
            log(
              chalk.underline(
                `${DASHBOARD_URL}/devices/new?token=${encodedToken}&name=${encodedHostname}`,
              ),
            );
            return;
            */
        }
        if (reason === 'INVALID_DEVICE_TOKEN') {
            /*
            log(chalk.redBright('Device token is invalid :('));
            return;
            */
        }
        // log(chalk.redBright(`Error code: ${reason}`));
    });
    tray = new electron_1.Tray(constants_1.trayIcons.BASE_ICON);
    tray.setPressedImage(constants_1.trayIcons.BASE_ICON_PRESSED);
    // tray.setContextMenu(Menu.buildFromTemplate([...DEFAULT_CONTEXT_MENU]));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsdUNBQWlFO0FBQ2pFLHVEQUErQztBQUMvQywwQ0FBNEM7QUFDNUMsb0NBQXlFO0FBQ3pFLDJDQUErRDtBQUkvRCxJQUFJLFVBQThCLENBQUM7QUFDbkMsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBRXJCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRTtJQUNqQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztDQUM1QztBQUVELElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRTtJQUNsQyxXQUFXLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQztDQUM5QztBQUVELDhCQUFXLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztBQUVqQyxJQUFJLElBQVUsQ0FBQztBQUVmLGNBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEtBQUssSUFBSSxFQUFFO0lBQ3pCLE1BQU0sV0FBVyxHQUFHLElBQUksaUJBQVcsQ0FBQyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDcEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUM7SUFFOUMsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNoRCxXQUFXLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztLQUNsQztJQUVELE1BQU0sS0FBSyxHQUFHLElBQUksb0JBQVcsQ0FBQztRQUM1QixNQUFNLEVBQUUsYUFBTztRQUNmLEtBQUssRUFBRSxZQUFNO0tBQ2QsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLFdBQVcsRUFBRTtRQUNoQiwyQkFBMkI7UUFDM0IsV0FBVyxHQUFHLE1BQU0sS0FBSyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDaEQsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztLQUMvQztJQUVELEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDWixXQUFXO0tBQ1osQ0FBQyxDQUFDO0lBRUgsS0FBSyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1FBQ3ZCLE1BQU0sV0FBVyxHQUFHO1lBQ2xCO2dCQUNFLEtBQUssRUFBRSxrQkFBa0I7Z0JBQ3pCLE9BQU8sRUFBRSxLQUFLO2FBQ2Y7U0FFRixDQUFDO1FBQ0YsSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUMsUUFBUSxDQUFDLHFCQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDcEQ7Ozs7O1VBS0U7SUFDSixDQUFDLENBQUMsQ0FBQztJQUVILEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO1FBQzNDLElBQUksU0FBUyxFQUFFO1lBQ2IsT0FBTztTQUNSO1FBRUQsSUFBSSxNQUFNLEtBQUssdUJBQXVCLEVBQUU7WUFDdEM7Ozs7Ozs7Ozs7Ozs7O2NBY0U7U0FDSDtRQUVELElBQUksTUFBTSxLQUFLLHNCQUFzQixFQUFFO1lBQ3JDOzs7Y0FHRTtTQUNIO1FBRUQsaURBQWlEO0lBQ25ELENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxHQUFHLElBQUksZUFBSSxDQUFDLHFCQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBUyxDQUFDLGlCQUFpQixDQUFDLENBQUM7SUFDbEQsMEVBQTBFO0FBQzVFLENBQUMsQ0FBQyxDQUFDO0FBRUg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUEyQ0UifQ==