import { debug as debugRoot } from './utils';
import path from 'path';
import net from 'net';
import dgram from 'dgram';
import { once } from 'events';
import { PassThrough, Duplex, pipeline } from 'stream';
import duplexify from 'duplexify';
import { MessageStream } from './MessageStream';
import { LotunSocket } from './LotunSocket';

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
  private lotunSocket: LotunSocket;
  private tcpServer?: net.Server;
  private udpServer?: dgram.Socket;
  private activeConnections: Set<Duplex>;
  constructor(options: { lotunSocket: LotunSocket; app: App }) {
    this.lotunSocket = options.lotunSocket;
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

        const appId = this.app.id;
        const { remoteAddress, remotePort } = socket;

        const duplex = this.lotunSocket.createDuplex({
          appId,
          remoteAddress,
          remotePort,
        });

        pipeline(socket, duplex);
        pipeline(duplex, socket);
      });

      tcpServer.listen({ port });
      await once(tcpServer, 'listening');

      this.tcpServer = tcpServer;
    } else {
      const udpServer = dgram.createSocket({ type: 'udp4' });
      udpServer.bind({ port });

      udpServer.on('message', (msg, rinfo) => {
        const readable = new PassThrough();
        const writeable = new PassThrough();
        const socket = duplexify(writeable, readable);

        this.activeConnections.add(socket);
        socket.on('close', () => {
          this.activeConnections.delete(socket);
        });

        const messageStream = new MessageStream(socket);
        messageStream.on('error', () => {
          socket.destroy();
        });

        messageStream.on('message', (type, payload) => {
          try {
            if (type === 'message') {
              const message = payload as { msg: string };
              const msg = Buffer.from(message.msg);
              udpServer.send(msg, rinfo.port, rinfo.address);
            }
          } catch (err) {
            messageStream.destroy();
          }
        });

        messageStream.send('message', { msg: msg.toString() });

        const appId = this.app.id;

        const duplex = this.lotunSocket.createDuplex({
          appId,
          rinfo,
        });

        pipeline(socket, duplex);
        pipeline(duplex, socket);
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
      this.tcpServer.close();
      await once(this.tcpServer, 'close');
    }

    if (this.udpServer) {
      this.udpServer.close();
      await once(this.udpServer, 'close');
    }
  }
}
