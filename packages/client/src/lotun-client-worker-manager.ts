import { EventEmitter } from "events";
import cluster from "cluster";
import os from "os";
import { LotunClient, LotunClientMeta } from "./lotun-client";
import { LotunCloseReason } from "./lotun-socket";
import { LotunClientWorkerMessage } from "./lotun-client-worker";
import { calculateTimeout } from "./util";

export function createLotunClientWorkerManager() {
  return new LotunClientWorkerManager();
}

export type LotunClientWorkersOptions = {
  mode: "NO_DEVICE_TOKEN" | "DEVICE_TOKEN";
  appConfig?: {
    type: "HTTP" | "TCP";
    target: string;
  };
  deviceToken: string;
  name?: string;
  deviceClientUrl: string;
  deviceClient?: {
    id: string;
  };
};

export class LotunClientWorkerManager {
  destroyed = false;
  lotunClient!: LotunClient;
  meta!: LotunClientMeta;
  options!: LotunClientWorkersOptions;
  leadWorker!: cluster.Worker;
  workers = new Set<{
    worker: cluster.Worker;
    startTimeout?: NodeJS.Timeout;
  }>();

  async initalize(lotunClient: LotunClient, meta: LotunClientMeta) {
    this.lotunClient = lotunClient;
    this.meta = meta;

    await this.readConfig();
    const options = lotunClient.options;

    this.options = {
      mode: options.mode,
      appConfig: options.appConfig,
      deviceToken: options.config?.deviceToken || "",
      name: options.name,
      deviceClientUrl: options.constants.DEVICE_CLIENT_URL,
    };

    if (this.options.mode === "NO_DEVICE_TOKEN") {
      this.meta.reconnect = false;
    }

    this.leadWorker = this.createWorker().worker;
  }

  private async readConfig() {
    const { mode } = this.lotunClient.options;
    switch (mode) {
      case "NO_DEVICE_TOKEN": {
        break;
      }
      case "DEVICE_TOKEN": {
        if (!this.lotunClient.options.config) {
          const config = await this.lotunClient.options.readConfig();
          if (!config?.deviceToken) {
            const deviceToken = await this.lotunClient.options.generateDeviceToken();
            this.lotunClient.options.setConfig({ deviceToken });
            await this.lotunClient.options.saveConfig();
          }
        }
        break;
      }
      default: {
        throw new Error(`Unknown mode ${mode}`);
      }
    }
  }

  emitDisconnect(reason: LotunCloseReason) {
    if (this.meta.lastDisconnectReason !== reason) {
      this.meta.lastDisconnectReason = reason;
      this.lotunClient.emit("disconnect", { reason });
    }
  }

  createWorker() {
    const stdio = ["ignore", "inherit", "inherit", "ipc"];

    cluster.setupMaster({
      exec: `${__dirname}/lotun-client-worker-fork.js`,
      stdio,
      // @ts-ignore
      windowsHide: true,
    });

    const workerHandle: {
      worker: cluster.Worker;
      startTimeout?: NodeJS.Timeout;
    } = {
      worker: cluster.fork(),
    };

    this.workers.add(workerHandle);

    workerHandle.worker.on("exit", async () => {
      if (workerHandle.startTimeout) {
        clearTimeout(workerHandle.startTimeout);
      }

      const reason: LotunCloseReason =
        this.meta.lastDisconnectReason || "NETWORK_ERROR";

      this.emitDisconnect(reason);
      this.workers.delete(workerHandle);

      // leader
      if (workerHandle.worker.id === this.leadWorker.id) {
        await this.destroy();
        if (this.meta.reconnect) {
          await this.lotunClient.connect();
        }
        return;
      }

      // workers
      if (!this.destroyed) {
        this.createWorker();
      }
    });

    const { disconnectCount } = this.meta;
    const timeout = calculateTimeout(disconnectCount);

    workerHandle.worker.on("message", (message: LotunClientWorkerMessage) => {
      if (message.type === "ready") {
        const message: LotunClientWorkerMessage = {
          type: "start",
          data: this.options,
        };
        workerHandle.startTimeout = setTimeout(() => {
          workerHandle.worker.send(message);
        }, timeout);
      }
      if (message.type === "connect") {
        const { id, options, app } = message.data;
        if (workerHandle.worker.id === this.leadWorker.id) {
          this.meta.disconnectCount = 0;
          this.meta.lastDisconnectReason = undefined;
          this.options.deviceClient = {
            id,
          };
          let workersLimit = options.workersLimit || os.cpus().length;
          for (let i = 1; i < workersLimit; i++) {
            this.createWorker();
          }

          this.lotunClient.emit("connect", { app });
        }
      }
      if (message.type === "disconnect") {
        this.meta.disconnectCount++;
        if (workerHandle.worker.id === this.leadWorker.id) {
          this.options.deviceClient = undefined;
          const reason = message.reason;
          this.emitDisconnect(reason);
        }
      }
    });

    return workerHandle;
  }

  async destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    for (const workerHandle of this.workers.values()) {
      if (workerHandle.startTimeout) {
        clearTimeout(workerHandle.startTimeout);
      }
      workerHandle.worker.kill();
    }

    const killTimeout = setTimeout(() => {
      for (const workerHandle of this.workers.values()) {
        workerHandle.worker.kill("SIGKILL");
      }
    }, 5000);

    while (this.workers.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    clearTimeout(killTimeout);
  }
}
