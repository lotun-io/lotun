import { debug as debugRoot } from './utils';
import { Rule, App } from './Rule';
import { Duplex } from 'stream';

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
      duplex.destroy();
      return;
    }

    this.activeConnections.add(duplex);

    duplex.on('close', () => {
      this.activeConnections.delete(duplex);
    });

    this.middlewares[0].rule.connection(...options);
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
