const { app, shell } = require('electron');
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