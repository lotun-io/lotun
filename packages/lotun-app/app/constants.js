"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const electron_1 = require("electron");
function getResourcesPath() {
    if (process.env.NODE_ENV === 'devel') {
        return `${process.cwd()}`;
    }
    return process.resourcesPath;
}
exports.trayIcons = {
    BASE_ICON: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-base.png')),
    BASE_ICON_PRESSED: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-base-pressed.png')),
    ONLINE_ICON: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-online.png')),
    ONLINE_ICON_PRESSED: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-online-pressed.png')),
    OFFLINE_ICON: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-offline.png')),
    OFFLINE_ICON_PRESSED: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-offline-pressed.png')),
    WARNING_ICON: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-warning.png')),
    WARNING_ICON_PRESSED: electron_1.nativeImage.createFromPath(path_1.default.resolve(getResourcesPath(), './assets/icons/tray-icon-warning-pressed.png')),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbnN0YW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUF3QjtBQUN4Qix1Q0FBNEM7QUFFNUMsU0FBUyxnQkFBZ0I7SUFDdkIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUU7UUFDcEMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDO0tBQzNCO0lBQ0QsT0FBTyxPQUFPLENBQUMsYUFBYSxDQUFDO0FBQy9CLENBQUM7QUFFWSxRQUFBLFNBQVMsR0FBRztJQUN2QixTQUFTLEVBQUUsc0JBQVcsQ0FBQyxjQUFjLENBQ25DLGNBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxtQ0FBbUMsQ0FBQyxDQUN0RTtJQUNELGlCQUFpQixFQUFFLHNCQUFXLENBQUMsY0FBYyxDQUMzQyxjQUFJLENBQUMsT0FBTyxDQUNWLGdCQUFnQixFQUFFLEVBQ2xCLDJDQUEyQyxDQUM1QyxDQUNGO0lBQ0QsV0FBVyxFQUFFLHNCQUFXLENBQUMsY0FBYyxDQUNyQyxjQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLEVBQUUscUNBQXFDLENBQUMsQ0FDeEU7SUFDRCxtQkFBbUIsRUFBRSxzQkFBVyxDQUFDLGNBQWMsQ0FDN0MsY0FBSSxDQUFDLE9BQU8sQ0FDVixnQkFBZ0IsRUFBRSxFQUNsQiw2Q0FBNkMsQ0FDOUMsQ0FDRjtJQUNELFlBQVksRUFBRSxzQkFBVyxDQUFDLGNBQWMsQ0FDdEMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLHNDQUFzQyxDQUFDLENBQ3pFO0lBQ0Qsb0JBQW9CLEVBQUUsc0JBQVcsQ0FBQyxjQUFjLENBQzlDLGNBQUksQ0FBQyxPQUFPLENBQ1YsZ0JBQWdCLEVBQUUsRUFDbEIsOENBQThDLENBQy9DLENBQ0Y7SUFDRCxZQUFZLEVBQUUsc0JBQVcsQ0FBQyxjQUFjLENBQ3RDLGNBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxzQ0FBc0MsQ0FBQyxDQUN6RTtJQUNELG9CQUFvQixFQUFFLHNCQUFXLENBQUMsY0FBYyxDQUM5QyxjQUFJLENBQUMsT0FBTyxDQUNWLGdCQUFnQixFQUFFLEVBQ2xCLDhDQUE4QyxDQUMvQyxDQUNGO0NBQ0YsQ0FBQyJ9