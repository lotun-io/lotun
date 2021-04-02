import pacote from "pacote";
import lockfile from "proper-lockfile";
import os from "os";
import path from "path";
import fs from "fs";
import { getCurrentLotunClientVersion, getLotunDataDirPath } from "./util";
import { EventEmitter } from "events";
import type { LotunClient } from "./lotun-client";
import type { LotunClientWorkerManager } from "./lotun-client-worker-manager";

interface LotunUpdaterEvents {
  update: (latestVersion: string) => void;
}

export interface LotunUpdater {
  on<U extends keyof LotunUpdaterEvents>(
    event: U,
    listener: LotunUpdaterEvents[U]
  ): this;

  once<U extends keyof LotunUpdaterEvents>(
    event: U,
    listener: LotunUpdaterEvents[U]
  ): this;

  emit<U extends keyof LotunUpdaterEvents>(
    event: U,
    ...args: Parameters<LotunUpdaterEvents[U]>
  ): boolean;
}

export class LotunUpdater extends EventEmitter {
  private updateEmitted = false;

  async createLotunClient() {
    while (true) {
      try {
        const { createLotunClient } = await this.lotunClient();
        return createLotunClient();
      } catch (err) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  async createLotunClientWorkerManager() {
    while (true) {
      try {
        const { createLotunClientWorkerManager } = await this.lotunClient();
        return createLotunClientWorkerManager();
      } catch (err) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private emitUpdate(latestVersion: string) {
    if (!this.updateEmitted) {
      this.updateEmitted = true;
      this.emit("update", latestVersion);
    }
  }

  private async lotunClient(): Promise<{
    createLotunClient: () => LotunClient;
    createLotunClientWorkerManager: () => LotunClientWorkerManager;
  }> {
    const currentVersion = getCurrentLotunClientVersion();
    let latestVersion = await getNpmLotunClientVersion();

    if (process.env.LOTUN_ENV === "local") {
      latestVersion = currentVersion;
    }

    if (currentVersion === latestVersion) {
      return {
        createLotunClient: require(`./lotun-client`).createLotunClient,
        createLotunClientWorkerManager: require(`./lotun-client-worker-manager`)
          .createLotunClientWorkerManager,
      };
    }

    const localVersion = getLocalLotunClientVersion(latestVersion);

    await fs.promises.mkdir(getLotunClientDir(), { recursive: true });
    const release = await lockfile.lock(getLotunClientDir());

    if (latestVersion !== localVersion) {
      this.emitUpdate(latestVersion);
      await fs.promises.rmdir(getLotunClientDir(), { recursive: true });
      await fs.promises.mkdir(getLotunClientDir(latestVersion), {
        recursive: true,
      });
      try {
        await downloadLotunClient(latestVersion);
        await fs.promises.writeFile(
          path.join(getReadyJsonPath(latestVersion)),
          JSON.stringify({ timestamp: new Date() })
        );
      } catch (err) {
        await release();
        throw err;
      }
    }

    const result = {
      createLotunClient: require(`${getLotunClientDir(
        latestVersion
      )}/dist/lotun-client`).createLotunClient,
      createLotunClientWorkerManager: require(`${getLotunClientDir(
        latestVersion
      )}/dist/lotun-client-worker-manager`).createLotunClientWorkerManager,
    };

    await release();
    return result;
  }
}

function getLotunClientDir(version?: string) {
  let clientDir = path.join(getLotunDataDirPath(), "client");
  if (version) {
    clientDir = path.join(clientDir, version);
  }
  return clientDir;
}

function getReadyJsonPath(version: string) {
  return path.join(getLotunClientDir(version), "ready.json");
}

function getPackageJsonPath(version: string) {
  return path.join(getLotunClientDir(version), "package.json");
}

async function downloadLotunClient(version: string) {
  await pacote.extract(`@lotun/client@${version}`, getLotunClientDir(version));
}

async function getNpmLotunClientVersion(version: string = "latest") {
  const manifest = await pacote.manifest(`@lotun/client@${version}`);
  return manifest.version;
}

function getLocalLotunClientVersion(version: string): string | undefined {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(getPackageJsonPath(version)).toString()
    );

    JSON.parse(fs.readFileSync(getReadyJsonPath(version)).toString());

    return packageJson.version;
  } catch (err) {
    return undefined;
  }
}
