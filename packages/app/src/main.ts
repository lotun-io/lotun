import { app, Tray, Menu, Notification, dialog } from "electron";
import { autoUpdater } from "electron-updater";
import { LotunUpdater, constants } from "@lotun/client";
import { trayIcons } from "./constants";
import { openPairURL } from "./helpers";
import { getDefaultContextMenu } from "./menu";

const lotunConstants = constants();

autoUpdater.autoDownload = false;

let tray: Tray;
const DEFAULT_CONTEXT_MENU = getDefaultContextMenu({
  dashboardUrl: lotunConstants.DASHBOARD_URL,
});

app.on("ready", async () => {
  tray = new Tray(trayIcons.BASE_ICON);
  tray.setPressedImage(trayIcons.BASE_ICON_PRESSED);
  tray.setContextMenu(Menu.buildFromTemplate(DEFAULT_CONTEXT_MENU));

  const lotunUpdater = new LotunUpdater();
  lotunUpdater.on("update", (latestVersion) => {});
  const lotunClient = await lotunUpdater.createLotunClient();
  lotunClient.on("update", (latestVersion) => {});

  lotunClient.connect();

  lotunClient.on("connect", () => {
    const contextMenu = [
      {
        label: "Device connected",
        enabled: false,
      },
      ...DEFAULT_CONTEXT_MENU,
    ];
    tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
    tray.setImage(trayIcons.ONLINE_ICON);
    tray.setPressedImage(trayIcons.ONLINE_ICON_PRESSED);
  });

  lotunClient.on("disconnect", ({ reason }) => {
    if (reason === "UNPAIRED_DEVICE_TOKEN") {
      const contextMenu = [
        {
          label: "Pair new device",
          click: () =>
            openPairURL(
              lotunClient.options.config!.deviceToken,
              lotunConstants.DASHBOARD_URL
            ),
        },
        ...DEFAULT_CONTEXT_MENU,
      ];
      tray.setContextMenu(Menu.buildFromTemplate(contextMenu));
      tray.setImage(trayIcons.WARNING_ICON);
      tray.setPressedImage(trayIcons.WARNING_ICON_PRESSED);
      const notification = new Notification({
        title: "Pair new device",
        body: "Click here to pair your device with lotun.io",
      });
      notification.show();
      notification.on("click", () =>
        openPairURL(
          lotunClient.options.config!.deviceToken,
          lotunConstants.DASHBOARD_URL
        )
      );
    } else {
      tray.setImage(trayIcons.OFFLINE_ICON);
      tray.setPressedImage(trayIcons.OFFLINE_ICON_PRESSED);
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
