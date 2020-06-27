"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const updates_1 = require("./updates");
function getDefaultContextMenu(options) {
    return [
        {
            type: 'separator',
        },
        {
            label: 'Open Dashboard',
            click: () => electron_1.shell.openExternal(`${options.dashboardUrl}`),
        },
        {
            label: 'Preferences',
            submenu: [
                {
                    type: 'checkbox',
                    id: 'openAtLogin',
                    label: 'Open at login',
                    checked: electron_1.app.getLoginItemSettings().openAtLogin,
                    click: (menuItem) => {
                        electron_1.app.setLoginItemSettings({
                            openAtLogin: menuItem.checked,
                        });
                    },
                },
            ],
        },
        {
            label: 'Check for updates',
            click: updates_1.checkForUpdates,
        },
        {
            label: 'Quit',
            click: () => electron_1.app.quit(),
        },
    ];
}
exports.getDefaultContextMenu = getDefaultContextMenu;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBTWtCO0FBQ2xCLHVDQUE0QztBQUU1QyxTQUFnQixxQkFBcUIsQ0FBQyxPQUVyQztJQUNDLE9BQU87UUFDTDtZQUNFLElBQUksRUFBRSxXQUFXO1NBQ2xCO1FBQ0Q7WUFDRSxLQUFLLEVBQUUsZ0JBQWdCO1lBQ3ZCLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxZQUFZLEVBQUUsQ0FBQztTQUMzRDtRQUNEO1lBQ0UsS0FBSyxFQUFFLGFBQWE7WUFDcEIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLElBQUksRUFBRSxVQUFVO29CQUNoQixFQUFFLEVBQUUsYUFBYTtvQkFDakIsS0FBSyxFQUFFLGVBQWU7b0JBQ3RCLE9BQU8sRUFBRSxjQUFHLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxXQUFXO29CQUMvQyxLQUFLLEVBQUUsQ0FBQyxRQUFhLEVBQUUsRUFBRTt3QkFDdkIsY0FBRyxDQUFDLG9CQUFvQixDQUFDOzRCQUN2QixXQUFXLEVBQUUsUUFBUSxDQUFDLE9BQU87eUJBQzlCLENBQUMsQ0FBQztvQkFDTCxDQUFDO2lCQUNGO2FBQ0Y7U0FDRjtRQUNEO1lBQ0UsS0FBSyxFQUFFLG1CQUFtQjtZQUMxQixLQUFLLEVBQUUseUJBQWU7U0FDdkI7UUFDRDtZQUNFLEtBQUssRUFBRSxNQUFNO1lBQ2IsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQUcsQ0FBQyxJQUFJLEVBQUU7U0FDeEI7S0FDRixDQUFDO0FBQ0osQ0FBQztBQXBDRCxzREFvQ0MifQ==