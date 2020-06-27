import { debug as debugRoot } from './utils';
import net from 'net';
import dgram, { RemoteInfo } from 'dgram';
import { once } from 'events';
import { Duplex, pipeline } from 'stream';
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
  private udpProxyMap: Map<string, MessageStream>;
  constructor(options: { lotunSocket: LotunSocket; app: App }) {
    this.lotunSocket = options.lotunSocket;
    this.app = options.app;
    this.activeConnections = new Set();
    this.udpProxyMap = new Map();
  }

  async init() {
    const port = Number(this.app.entryPoint.port);

    if (this.app.type === 'TCP') {
      const tcpServer = net.createServer();
      tcpServer.on('connection', (socket) => {
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

        pipeline(socket, duplex, function () {});
        pipeline(duplex, socket, function () {});
      });

      tcpServer.listen({ port });
      await once(tcpServer, 'listening');

      this.tcpServer = tcpServer;
    }

    if (this.app.type === 'UDP') {
      const udpServer = dgram.createSocket({ type: 'udp4' });
      udpServer.bind({ port });

      udpServer.on('message', (msg, rinfo) => {
        debug('udpServer', msg, rinfo);
        const appId = this.app.id;

        const senderId = `${rinfo.address}${rinfo.port}`;
        let messageStream = this.udpProxyMap.get(senderId);
        let duplex: Duplex;

        if (!messageStream) {
          debug('messageStream', msg, rinfo);
          duplex = this.lotunSocket.createDuplex({
            appId,
            rinfo,
          });

          duplex.on('close', () => {
            debug('duplex.close', rinfo);
            this.activeConnections.delete(duplex);
          });

          this.activeConnections.add(duplex);

          messageStream = new MessageStream(duplex);

          this.udpProxyMap.set(senderId, messageStream);

          messageStream.on('error', () => {
            messageStream!.destroy();
          });

          messageStream.on('message', (type, payload) => {
            try {
              if (type === 'message') {
                const message = payload as { msg: string; rinfo: RemoteInfo };
                const msg = Buffer.from(message.msg);
                udpServer.send(msg, rinfo.port, rinfo.address);
              }
            } catch (err) {
              messageStream!.destroy();
            }
          });
        }

        messageStream.send('message', { msg: msg.toString(), rinfo });
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
