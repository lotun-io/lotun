import { Duplex } from "stream";
import type { EntryAppType } from "./lotun-socket";
import net from "net";
import { once } from "events";
import type { Apps } from "./apps";

export class EntryApp {
  private connections = new Set<Duplex>();
  private initalize: Promise<void>;
  private server?: net.Server;
  destroyed = false;

  constructor(public app: EntryAppType, private apps: Apps) {
    this.initalize = (async () => {
      while (this.destroyed === false) {
        try {
          this.server = net.createServer((socket) => {
            this.connections.add(socket);
            socket.once("close", () => {
              this.connections.delete(socket);
            });

            const { remoteAddress } = socket;
            const remortePort = socket.remotePort
              ? String(socket.remotePort)
              : undefined;

            this.apps.forward(socket, {
              appId: app.id,
              remoteAddress,
              remortePort,
            });
          });
          this.server.listen(app.entryPoint.port);
          await once(this.server, "listening");

          break;
        } catch (err) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    })();
  }

  async destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    try {
      await this.initalize;
    } catch (err) {}

    for (const duplex of this.connections.values()) {
      duplex.destroy();
    }
  }
}
