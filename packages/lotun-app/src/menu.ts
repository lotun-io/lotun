import { app, shell } from 'electron';
import { checkForUpdates } from './updates';
import { LOTUN_URL } from './constants';

export const DEFAULT_CONTEXT_MENU = [
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
        click: (menuItem: any) => {
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
