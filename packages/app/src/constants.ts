import path from "path";
import { nativeImage, app } from "electron";

function getResourcesPath() {
  if (process.env.NODE_ENV === "local") {
    return `${process.cwd()}`;
  }
  return process.resourcesPath;
}

export const trayIcons = {
  BASE_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), "./assets/icons/tray-icon-base.png")
  ),
  BASE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      "./assets/icons/tray-icon-base-pressed.png"
    )
  ),
  ONLINE_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), "./assets/icons/tray-icon-online.png")
  ),
  ONLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      "./assets/icons/tray-icon-online-pressed.png"
    )
  ),
  OFFLINE_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), "./assets/icons/tray-icon-offline.png")
  ),
  OFFLINE_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      "./assets/icons/tray-icon-offline-pressed.png"
    )
  ),
  WARNING_ICON: nativeImage.createFromPath(
    path.resolve(getResourcesPath(), "./assets/icons/tray-icon-warning.png")
  ),
  WARNING_ICON_PRESSED: nativeImage.createFromPath(
    path.resolve(
      getResourcesPath(),
      "./assets/icons/tray-icon-warning-pressed.png"
    )
  ),
};
