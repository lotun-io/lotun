import { getCurrentLotunClientVersion, osInfo } from "./util";
import { LotunClientWorkersOptions } from "./lotun-client-worker-manager";
import { Apps } from "./apps";
import {
  LotunSocket,
  LotunCloseReason,
  LotunMessageType,
} from "./lotun-socket";
import http from "http";
import https from "https";

export type LotunClientWorkerMessage =
  | {
      type: "ready";
    }
  | {
      type: "start";
      data: LotunClientWorkersOptions;
    }
  | {
      type: "connect";
      data: LotunMessageType["connect"];
    }
  | {
      type: "disconnect";
      reason: LotunCloseReason;
    };

export class LotunClientWorker {
  private lotunSocket?: LotunSocket;
  private apps!: Apps;
  private pingTimeoutHandle?: NodeJS.Timeout;
  private destroyed = false;

  constructor(private options: LotunClientWorkersOptions) {
    this.connect();
  }

  private async connect() {
    const httpClient = this.options.deviceClientUrl.startsWith("https")
      ? https
      : http;

    const req = httpClient.request(this.options.deviceClientUrl, {
      timeout: 10000,
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
      },
    });

    req.on("error", () => {
      this.destroy();
    });

    req.end();

    req.on("response", (res) => {
      if (res.statusCode === 447) {
        this.destroy(res.statusMessage as LotunCloseReason);
        return;
      }

      this.destroy();
    });

    req.on("upgrade", async (req, socket, head) => {
      socket.setTimeout(1000 * 60);

      socket.on("timeout", () => {
        this.destroy();
      });

      socket.on("error", () => {
        this.destroy();
      });

      this.lotunSocket = new LotunSocket(socket);

      this.lotunSocket.on("ping", () => {
        if (this.pingTimeoutHandle) {
          this.pingTimeoutHandle.refresh();
        }
      });

      this.pingTimeoutHandle = setTimeout(() => {
        this.destroy();
      }, 1000 * 60);

      this.lotunSocket.once("close", ({ reason }) => {
        this.destroy(reason);
      });

      this.apps = new Apps(this.lotunSocket);

      const id = this.options.deviceClient?.id;
      const { mode, appConfig, name, deviceToken } = this.options;
      const version = getCurrentLotunClientVersion();
      const os = await osInfo();

      this.lotunSocket.deviceClientInfo({
        id,
        name,
        mode,
        appConfig,
        deviceToken,
        version,
        os,
      });

      this.lotunSocket.on("connect", (payload) => {
        const message: LotunClientWorkerMessage = {
          type: "connect",
          data: payload,
        };
        process.send!(message);
      });

      this.lotunSocket.on("apps", (payload) => {
        this.apps.updateApps(payload);
      });

      this.lotunSocket.on("duplex", (duplex, meta) => {
        this.apps.duplex(duplex, meta);
      });
    });
  }

  async destroy(closeReason: LotunCloseReason = "NETWORK_ERROR") {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    const message: LotunClientWorkerMessage = {
      type: "disconnect",
      reason: closeReason,
    };

    process.send!(message);

    if (this.lotunSocket) {
      this.lotunSocket.destroy();
    }

    if (this.pingTimeoutHandle) {
      clearTimeout(this.pingTimeoutHandle);
    }

    if (this.apps) {
      await this.apps.destroy();
    }

    setTimeout(() => {
      process.exit();
    }, 200);
  }
}
