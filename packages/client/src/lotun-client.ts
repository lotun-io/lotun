import { EventEmitter } from "events";
import { LotunClientWorkerManager } from "./lotun-client-worker-manager";
import { LotunOptions } from "./lotun-options";
import { LotunUpdater } from "./lotun-updater";
import { LotunCloseReason, LotunMessageType } from "./lotun-socket";

export function createLotunClient() {
  return new LotunClient();
}

interface LotunClientEvents {
  connect: (params: { app?: LotunMessageType["connect"]["app"] }) => void;
  disconnect: (params: { reason: LotunCloseReason }) => void;
  update: (latestVersion: string) => void;
}

export interface LotunClient {
  on<U extends keyof LotunClientEvents>(
    event: U,
    listener: LotunClientEvents[U]
  ): this;

  once<U extends keyof LotunClientEvents>(
    event: U,
    listener: LotunClientEvents[U]
  ): this;

  emit<U extends keyof LotunClientEvents>(
    event: U,
    ...args: Parameters<LotunClientEvents[U]>
  ): boolean;
}

export type LotunClientMeta = {
  reconnect: boolean;
  disconnectCount: number;
  lastDisconnectReason?: LotunCloseReason;
};

export class LotunClient extends EventEmitter {
  options: LotunOptions;
  private workerManager?: LotunClientWorkerManager;
  private meta: LotunClientMeta = {
    disconnectCount: 0,
    reconnect: true,
  };

  constructor() {
    super();
    this.options = new LotunOptions();
  }

  async connect() {
    this.meta.reconnect = true;

    if (this.workerManager?.destroyed) {
      this.workerManager = undefined;
    }

    if (!this.workerManager) {
      const lotunUpdater = new LotunUpdater();
      lotunUpdater.on("update", (...args) => {
        this.emit("update", ...args);
      });
      this.workerManager = await lotunUpdater.createLotunClientWorkerManager();
      await this.workerManager.initalize(this, this.meta);
    }
  }

  async disconnect() {
    this.meta.reconnect = false;
    if (this.workerManager) {
      await this.workerManager.destroy();
    }
  }
}
