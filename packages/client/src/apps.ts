import { Duplex } from "stream";
import {
  EntryAppType,
  ForwardAppType,
  LotunMessageApps,
  LotunSocket,
} from "./lotun-socket";
import PQueue from "p-queue";
import { ForwardApp } from "./forward-app";
import { EntryApp } from "./entry-app";
import { pipeline } from "stream";

export class Apps {
  queue = new PQueue({ concurrency: 1 });
  constructor(private lotunSocket: LotunSocket) {}

  forwardAppsMap = new Map<string, ForwardApp>();
  entryAppsMap = new Map<string, EntryApp>();

  updateHealthCheck(params: {
    appId: string;
    status: "HEALTHY" | "UNHEALTHY";
  }) {
    const { appId, status } = params;

    this.lotunSocket.updateHealthCheck({
      appId,
      status,
    });
  }

  duplex(duplex: Duplex, handshakeData: unknown) {
    const { appId } = handshakeData as { appId: string };
    const app = this.forwardAppsMap.get(appId);

    if (!app) {
      duplex.destroy();
      return;
    }

    app.duplex(duplex);
  }

  forward(socket: Duplex, handshakeData: unknown) {
    const duplex = this.lotunSocket.createDuplex(handshakeData);
    pipeline(socket, duplex, function () {});
    pipeline(duplex, socket, function () {});
  }

  updateApps({ entry, forward }: LotunMessageApps) {
    this.updateEntryApps(entry);
    this.updateForwardApps(forward);
  }

  private async updateForwardApps(apps: ForwardAppType[]) {
    this.deleteMissingForwardApps(apps.map((app) => app.id));
    apps.forEach((newApp) => {
      this.queue.add(async () => {
        let app = this.forwardAppsMap.get(newApp.id);
        if (!app) {
          app = new ForwardApp(newApp, this);
        }
        if (app.app.hash !== newApp.hash) {
          await app.destroy();
          app = new ForwardApp(newApp, this);
        }
        this.forwardAppsMap.set(app.app.id, app);
      });
    });
  }

  private async updateEntryApps(apps: EntryAppType[]) {
    this.deleteMissingEntryApps(apps.map((app) => app.id));
    apps.forEach((newApp) => {
      this.queue.add(async () => {
        let app = this.entryAppsMap.get(newApp.id);
        if (!app) {
          app = new EntryApp(newApp, this);
        }
        if (app.app.hash !== newApp.hash) {
          await app.destroy();
          app = new EntryApp(newApp, this);
        }
        this.entryAppsMap.set(app.app.id, app);
      });
    });
  }

  private deleteMissingForwardApps(ids: string[]) {
    const missingAppIds = [...this.forwardAppsMap.keys()].filter((one) => {
      return !ids.includes(one);
    });

    missingAppIds.map((id) => {
      this.queue.add(async () => {
        const app = this.forwardAppsMap.get(id);
        if (app) {
          await app.destroy();
          this.forwardAppsMap.delete(id);
        }
      });
    });
  }

  private deleteMissingEntryApps(ids: string[]) {
    const missingAppIds = [...this.entryAppsMap.keys()].filter((one) => {
      return !ids.includes(one);
    });

    missingAppIds.map((id) => {
      this.queue.add(async () => {
        const app = this.entryAppsMap.get(id);
        if (app) {
          await app.destroy();
          this.entryAppsMap.delete(id);
        }
      });
    });
  }

  async destroy() {
    this.deleteMissingForwardApps([]);
    this.deleteMissingEntryApps([]);
    await this.queue.onEmpty();
  }
}
