import { debug as debugRoot } from './utils';
import { createSocket } from './Socket';
import { App, Middleware, Rule, UdpProxySocket } from './Middleware';
import { Duplex } from 'stream';

const debug = debugRoot.extend('ForwardPoint');
const eventDebug = require('event-debug');

export class ForwardPoint {
  private app: App;
  private middlewares: { middleware: Middleware; priority: string }[];
  private configDir: string;
  private activeConnections: Set<Duplex>;

  constructor(options: { app: App; configDir: string }) {
    this.app = options.app;
    this.configDir = options.configDir;
    this.middlewares = [];
    this.activeConnections = new Set();
  }

  connection(...options: any[]) {
    const duplex = options[0] as Duplex;

    if (this.middlewares.length === 0) {
      duplex.destroy();
      return;
    }

    this.activeConnections.add(duplex);

    duplex.on('close', () => {
      this.activeConnections.delete(duplex);
    });

    if (this.app.type === 'HTTP' || this.app.type === 'TCP') {
      const handshakeData = options[1];
      const { remoteAddress, remotePort } = handshakeData;

      const socket = createSocket(duplex, {
        remoteAddress,
        remotePort,
      });

      this.middlewares[0].middleware.connection(socket);
    }

    if (this.app.type === 'UDP') {
      const handshakeData = options[1];
      const { rinfo } = handshakeData;

      const udpProxySocket = new UdpProxySocket({ duplex, rinfo });

      udpProxySocket.on('message', (msg, rinfo) => {
        debug('udpProxySocket', msg, rinfo);
      });

      this.middlewares[0].middleware.connection(udpProxySocket);
    }
  }

  async addMiddleware(
    options: {
      id: string;
      rule: Rule;
      name: string;
      optionsScript: string;
      updatedAt: string;
    },
    priority: string,
  ) {
    debug('addMiddleware', options);
    const middleware = new Middleware({
      app: this.app,
      configDir: this.configDir,
      ...options,
    });

    await middleware.init();

    this.middlewares.push({
      middleware,
      priority,
    });

    this.sortMiddlewares();
  }

  sortMiddlewares() {
    this.middlewares.sort(function (a, b) {
      if (BigInt(a.priority) < BigInt(b.priority)) {
        return -1;
      }
      if (BigInt(a.priority) > BigInt(b.priority)) {
        return 1;
      }
      return 0;
    });

    this.middlewares.map((middleware, index) => {
      if (index < this.middlewares.length - 1) {
        // @ts-ignore
        middleware.middleware.context.next = this.middlewares[
          index + 1
        ].middleware;
      }
    });
  }

  async destroy() {
    for (const socket of this.activeConnections.values()) {
      socket.destroy();
    }

    this.middlewares.map((middleware) => {
      middleware.middleware.destroy();
    });
  }
}
