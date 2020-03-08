import {
  app,
  shell,
  ContextMenuParams,
  MenuItemConstructorOptions,
  MenuItem,
} from 'electron';
import { checkForUpdates } from './updates';

export function getDefaultContextMenu(options: {
  dashboardUrl: string;
}): Array<MenuItemConstructorOptions | MenuItem> {
  return [
    {
      type: 'separator',
    },
    {
      label: 'Open Dashboard',
      click: () => shell.openExternal(`${options.dashboardUrl}`),
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
}
