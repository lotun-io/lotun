import { debug as debugRoot, createSocketPair } from './utils';
import net from 'net';
import { RemoteInfo } from 'dgram';
import { Rule, App } from './Rule';
import { MessageStream } from './MessageStream';
import { Duplex, pipeline } from 'stream';
const debug = debugRoot.extend('ForwardPoint');

export class ForwardPoint {
  private app: App;
  private middlewares: { rule: Rule; priority: string }[];
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
      // @TODO notify no forward rules ?!
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

      const socket = createSocketPair(
        { port: 80, remoteAddress, remotePort },
        remoteSocket => {
          this.middlewares[0].rule.connection(remoteSocket);
        },
      );

      pipeline(duplex, socket);
      pipeline(socket, duplex);

      this.middlewares[0].rule.connection(...options);
      return;
    }

    if (this.app.type === 'UDP') {
      this.activeConnections.add(duplex);
      const messageStream = new MessageStream(duplex);

      const send = function(msg: Buffer) {
        messageStream.send('message', { msg: msg.toString() });
      };

      messageStream.on('error', () => {
        duplex.destroy();
      });

      messageStream.on('message', (type, payload) => {
        if (type === 'message') {
          const data = payload as { msg: string; rinfo: RemoteInfo };
          const { msg, rinfo } = data;
          this.middlewares[0].rule.connection(msg, rinfo, send, messageStream);
        }
      });
      return;
    }

    duplex.destroy();
  }

  async addMiddleware(
    options: {
      id: string;
      name: string;
      version: string;
      optionsScript: string;
      ruleScript: string;
    },
    priority: string,
  ) {
    debug('addMiddleware', options);
    const rule = new Rule({
      app: this.app,
      configDir: this.configDir,
      ...options,
    });

    await rule.init();

    this.middlewares.push({
      rule,
      priority,
    });

    this.sortMiddlewares();
  }

  sortMiddlewares() {
    this.middlewares.sort(function(a, b) {
      if (BigInt(a.priority) < BigInt(b.priority)) {
        return -1;
      }
      if (BigInt(a.priority) > BigInt(b.priority)) {
        return 1;
      }
      return 0;
    });

    this.middlewares.map((rule, index) => {
      if (index < this.middlewares.length - 1) {
        // @ts-ignore
        rule.rule.context.nextRule = this.middlewares[index + 1].rule;
      }
    });
  }

  async destroy() {
    for (const socket of this.activeConnections.values()) {
      socket.destroy();
    }

    this.middlewares.map(rule => {
      rule.rule.context.emit('destroy');
    });
  }
}
