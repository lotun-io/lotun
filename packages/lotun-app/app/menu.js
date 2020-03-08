"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const updates_1 = require("./updates");
const constants_1 = require("./constants");
exports.DEFAULT_CONTEXT_MENU = [
    {
        type: 'separator',
    },
    {
        label: 'Open Dashboard',
        click: () => electron_1.shell.openExternal(`https://dashboard.${constants_1.LOTUN_URL}`),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBQXNDO0FBQ3RDLHVDQUE0QztBQUM1QywyQ0FBd0M7QUFFM0IsUUFBQSxvQkFBb0IsR0FBRztJQUNsQztRQUNFLElBQUksRUFBRSxXQUFXO0tBQ2xCO0lBQ0Q7UUFDRSxLQUFLLEVBQUUsZ0JBQWdCO1FBQ3ZCLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBSyxDQUFDLFlBQVksQ0FBQyxxQkFBcUIscUJBQVMsRUFBRSxDQUFDO0tBQ2xFO0lBQ0Q7UUFDRSxLQUFLLEVBQUUsYUFBYTtRQUNwQixPQUFPLEVBQUU7WUFDUDtnQkFDRSxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsRUFBRSxFQUFFLGFBQWE7Z0JBQ2pCLEtBQUssRUFBRSxlQUFlO2dCQUN0QixPQUFPLEVBQUUsY0FBRyxDQUFDLG9CQUFvQixFQUFFLENBQUMsV0FBVztnQkFDL0MsS0FBSyxFQUFFLENBQUMsUUFBYSxFQUFFLEVBQUU7b0JBQ3ZCLGNBQUcsQ0FBQyxvQkFBb0IsQ0FBQzt3QkFDdkIsV0FBVyxFQUFFLFFBQVEsQ0FBQyxPQUFPO3FCQUM5QixDQUFDLENBQUM7Z0JBQ0wsQ0FBQzthQUNGO1NBQ0Y7S0FDRjtJQUNEO1FBQ0UsS0FBSyxFQUFFLG1CQUFtQjtRQUMxQixLQUFLLEVBQUUseUJBQWU7S0FDdkI7SUFDRDtRQUNFLEtBQUssRUFBRSxNQUFNO1FBQ2IsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQUcsQ0FBQyxJQUFJLEVBQUU7S0FDeEI7Q0FDRixDQUFDIn0=