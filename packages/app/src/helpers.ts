import fs from "fs";
import { hostname } from "os";
import { shell } from "electron";

export function openPairURL(token: string, dashboardUrl: string) {
  const pairURL = `${dashboardUrl}/devices/new?token=${token}&name=${hostname()}`;
  shell.openExternal(pairURL);
}
