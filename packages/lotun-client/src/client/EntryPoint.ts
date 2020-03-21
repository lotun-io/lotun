import { debug as debugRoot } from './utils';
import path from 'path';
import net from 'net';
import dgram from 'dgram';
import { once } from 'events';

const debug = debugRoot.extend('EntryPoint');

type App = {
  id: string;
  type: 'HTTP' | 'TCP' | 'UDP';
  name: string;
  entryPoint: {
    id: string;
    type: 'HOSTNAME' | 'EXTERNAL_PORT' | 'DEVICE_PORT';
    name: string;
    port: string;
  };
};

export class EntryPoint {
  private app: App;
  private tcpServer?: net.Server;
  private udpServer?: dgram.Socket;
  private activeConnections: Set<net.Socket>;
  constructor(options: { app: App }) {
    this.app = options.app;
    this.activeConnections = new Set();
  }

  async init() {
    const port = Number(this.app.entryPoint.port);
    if (this.app.type === 'TCP') {
      const tcpServer = net.createServer();
      tcpServer.on('connection', socket => {
        this.activeConnections.add(socket);

        socket.on('close', () => {
          this.activeConnections.delete(socket);
        });

        socket.on('error', () => {
          socket.destroy();
        });
      });

      tcpServer.listen({ port });
      await once(tcpServer, 'listening');

      this.tcpServer = tcpServer;
    } else {
      const udpServer = dgram.createSocket({ type: 'udp4' });
      udpServer.bind({ port });

      udpServer.on('message', (msg, rinfo) => {
        console.log('!! message !!');
      });

      await once(udpServer, 'listening');

      this.udpServer = udpServer;
    }
  }

  async destroy() {
    for (const socket of this.activeConnections.values()) {
      socket.destroy();
    }

    if (this.tcpServer) {
      this.tcpServer?.close();
      await once(this.tcpServer, 'close');
    }

    if (this.udpServer) {
      this.udpServer.close();
      await once(this.udpServer, 'close');
    }
  }
}
