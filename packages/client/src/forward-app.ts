import { Duplex, pipeline } from "stream";
import type { Apps } from "./apps";
import type { ForwardAppType } from "./lotun-socket";
import net from "net";
import { once } from "events";

export class ForwardApp {
  private destroyed = false;
  private connections = new Set<Duplex>();
  private healthCheckTimeoutHandle?: NodeJS.Timeout;
  private lastHealthCheckStatus: "HEALTHY" | "UNHEALTHY" | undefined;

  constructor(public app: ForwardAppType, private apps: Apps) {
    this.initalize();
    this.healthCheck().finally(() => {
      this.healthCheckTimeoutHandle = setTimeout(() => {
        this.healthCheck();
      }, 5000);
    });
  }

  initalize() {}

  getTargetUrl() {
    let target =
      this.app.middlewares.http?.proxy?.target ||
      this.app.middlewares.tcp?.proxy?.target;

    if (!target) {
      return;
    }

    const url = new URL(target);
    return url;
  }

  async healthCheck() {
    try {
      const targetUrl = this.getTargetUrl();

      if (!targetUrl) {
        this.updateHealthCheck("HEALTHY");
        return;
      }

      const host = targetUrl.hostname;
      const port = Number(targetUrl.port);
      const connection = net.connect({ host, port });
      const timeout = setTimeout(() => {
        connection.emit("error", new Error("ETIMEOUT"));
      }, 5000);

      try {
        await once(connection, "connect");
        this.updateHealthCheck("HEALTHY");
      } catch (err) {
        throw err;
      } finally {
        connection.destroy();
        clearTimeout(timeout);
      }
    } catch (err) {
      this.updateHealthCheck("UNHEALTHY");
    }

    if (this.destroyed) {
      return;
    }

    if (this.healthCheckTimeoutHandle) {
      this.healthCheckTimeoutHandle.refresh();
    }
  }

  updateHealthCheck(status: "HEALTHY" | "UNHEALTHY") {
    if (this.destroyed) {
      return;
    }

    if (this.lastHealthCheckStatus) {
      if (this.lastHealthCheckStatus === status) {
        return;
      }
    }

    const appId = this.app.id;
    this.apps.updateHealthCheck({
      appId,
      status,
    });

    this.lastHealthCheckStatus = status;
  }

  duplex(duplex: Duplex) {
    if (this.destroyed) {
      duplex.destroy();
      return;
    }

    this.connections.add(duplex);
    duplex.once("close", () => {
      this.connections.delete(duplex);
    });

    const targetUrl = this.getTargetUrl();
    // @TODO - https & HTTP EP with no target pass into http-proxy
    if (!targetUrl) {
      throw new Error("Should not happen");
    }

    const host = targetUrl.hostname;
    const port = Number(targetUrl.port);
    const socket = net.connect({ host, port });

    pipeline(socket, duplex, function () {});
    pipeline(duplex, socket, function () {});
  }

  async destroy() {
    this.destroyed = true;
    if (this.healthCheckTimeoutHandle) {
      clearTimeout(this.healthCheckTimeoutHandle);
    }
    for (const duplex of this.connections.values()) {
      duplex.destroy();
    }
  }
}
