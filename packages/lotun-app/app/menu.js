const { app, shell } = require('electron');
const { exec } = require('child_process');
const { platform } = require('process');
const { checkForUpdates } = require('./updates');
const { LOTUN_URL } = require('./constants');

const DEFAULT_CONTEXT_MENU = [
  {
    type: 'separator',
  },
  {
    label: 'Open Dashboard',
    click: () => shell.openExternal(`https://dashboard.${LOTUN_URL}`),
  },
  {
    label: 'Preferences',
    submenu: [
      {
        type: 'checkbox',
        id: 'openAtLogin',
        label: 'Open at login',
        checked: app.getLoginItemSettings().openAtLogin,
        click: menuItem => {
          app.setLoginItemSettings({
            openAtLogin: menuItem.checked,
          });
          /*
          if (!menuItem.checked) {
            if (platform === 'darwin') {
              exec(`osascript -e 'tell application "System Events" to delete login item "${app.getName()}"'`);
            }
          } else {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked,
            });
          }
          */
        },
      },
    ],
  },
  {
    label: 'Check for updates',
    click: checkForUpdates,
  },
  {
    label: 'Quit',
    click: () => app.quit(),
  },
];

module.exports = {
  DEFAULT_CONTEXT_MENU,
};
