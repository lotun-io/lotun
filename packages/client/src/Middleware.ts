import { Agent as HttpAgent, AgentOptions } from 'http';
import net from 'net';
import { RemoteInfo } from 'dgram';
import { EventEmitter } from 'events';
import { debug as debugRoot } from './utils';

const debug = debugRoot.extend('Middleware');

import { createSocketPair } from './Socket';
import { Duplex, pipeline } from 'stream';
import { MessageStream } from './MessageStream';

export type EntryPoint = {
  id: string;
  name: string;
  type: 'HOSTNAME' | 'EXTERNAL_PORT' | 'DEVICE_PORT';
};

export type App = {
  id: string;
  name: string;
  type: 'HTTP' | 'TCP' | 'UDP';
  entryPoint: EntryPoint;
};

export type Rule = {
  id: string;
  name: string;
  version: string;
  ruleScript: string;
};

export interface UdpProxySocket {
  on(
    event: 'message',
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  once(
    event: 'message',
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  on(event: 'close', listener: () => void): this;
  once(event: 'close', listener: () => void): this;
}

export class UdpProxySocket extends EventEmitter {
  socket: net.Socket;
  rinfo: RemoteInfo;

  private messageStream: MessageStream;

  constructor(options: { duplex: Duplex; rinfo: RemoteInfo }) {
    super();
    this.rinfo = options.rinfo;

    const { socket, remoteSocket } = createSocketPair({});
    const { duplex } = options;

    pipeline(duplex, socket, function () {});
    pipeline(socket, duplex, function () {});

    this.socket = remoteSocket;

    this.socket.setTimeout(30 * 1000);

    this.socket.on('timeout', () => {
      this.socket.destroy();
    });

    this.socket.on('close', (...args: any[]) => {
      this.emit('close', ...args);
    });

    this.messageStream = new MessageStream(this.socket);
    this.messageStream.on('error', () => {
      this.messageStream.destroy();
    });

    this.messageStream.on('message', (type, payload) => {
      if (type === 'message') {
        const data = payload as { msg: string; rinfo: RemoteInfo };
        const msg = Buffer.from(data.msg);
        this.emit('message', msg, data.rinfo);
      }
    });
  }

  setTimeout(...args: any[]) {
    // @ts-ignore
    this.socket.setTimeout(...args);
  }

  send(msg: Buffer) {
    this.messageStream.send('message', { msg: msg.toString() });
  }

  pause() {
    this.socket.pause();
  }

  resume() {
    this.socket.resume();
  }

  destroy() {
    this.socket.destroy();
  }
}

export class NextMiddlewareAgent extends HttpAgent {
  private __remoteOptions: { remoteAddress?: string; remotePort?: number } = {};
  private ctx: MiddlewareContext;
  constructor(ctx: MiddlewareContext, opts?: AgentOptions) {
    super(opts);
    this.ctx = ctx;
  }

  setRemoteOptions(options: { remoteAddress?: string; remotePort?: number }) {
    const { remoteAddress, remotePort } = options;
    this.__remoteOptions = { remoteAddress, remotePort };
    return this;
  }

  createConnection(
    options: net.SocketConnectOpts,
    callback: (err: Error | null, result?: net.Socket) => void,
  ) {
    try {
      let { socket, remoteSocket } = createSocketPair({
        ...options,
        ...this.__remoteOptions,
      });

      this.ctx.nextMiddleware(remoteSocket);

      this.__remoteOptions = {};
      callback(null, socket);
      return socket;
    } catch (err) {
      callback(err);
    }
  }
}

export interface MiddlewareContext {
  on(event: 'connection', listener: (socket: net.Socket) => void): this;
  once(event: 'connection', listener: (socket: net.Socket) => void): this;
  on(
    event: 'udpProxySocket',
    listener: (udpProxySocket: UdpProxySocket) => void,
  ): this;
  once(
    event: 'udpProxySocket',
    listener: (udpProxySocket: UdpProxySocket) => void,
  ): this;
  on(event: 'destroy', listener: () => void): this;
  once(event: 'destroy', listener: () => void): this;
}

export type MiddlewareFunction = (ctx: MiddlewareContext) => Promise<any>;

export class MiddlewareContext extends EventEmitter {
  private current: Middleware;
  private next: Middleware | undefined;
  private lastUse?: Middleware;

  options!: (...args: any[]) => any;
  app: App;

  constructor(options: { app: App; middleware: Middleware }) {
    super();
    this.current = options.middleware;
    this.app = options.app;

    this.use = this.use.bind(this);
    this.nextMiddleware = this.nextMiddleware.bind(this);
    this.nextMiddlewareSocket = this.nextMiddlewareSocket.bind(this);
    this.nextMiddlewareAgent = this.nextMiddlewareAgent.bind(this);
  }

  async use(...args: MiddlewareFunction[]) {
    for (const middleware of args) {
      if (!this.lastUse) {
        await this.current.init(middleware);
        this.lastUse = this.current;
      } else {
        const newMiddleware = this.current.clone();

        newMiddleware.context.next = this.lastUse.context.next;
        this.lastUse.context.next = newMiddleware;

        await newMiddleware.init(middleware);
        this.lastUse = newMiddleware;
      }
    }
  }

  nextMiddleware(socket: net.Socket | UdpProxySocket) {
    if (!this.next) {
      throw new Error('MiddlewareContext does not have next middleware.');
    }

    this.next.connection(socket);
  }

  nextMiddlewareSocket(options: {
    remoteAddress?: string;
    remotePort?: number;
  }): net.Socket {
    const { remoteAddress, remotePort } = options;
    const { socket, remoteSocket } = createSocketPair({
      remoteAddress,
      remotePort,
    });
    this.nextMiddleware(remoteSocket);
    return socket;
  }

  nextMiddlewareAgent(opts?: AgentOptions) {
    return new NextMiddlewareAgent(this, opts);
  }
}

export class Middleware {
  id: string;
  name: string;
  app: App;
  files: Record<string, string>;
  updatedAt: string;
  context: MiddlewareContext;
  configDir: string;

  constructor(options: {
    id: string;
    app: App;
    name: string;
    files: Record<string, string>;
    updatedAt: string;
    configDir: string;
  }) {
    this.id = options.id;
    this.name = options.name;
    this.app = options.app;
    this.files = options.files;
    this.updatedAt = options.updatedAt;
    this.configDir = options.configDir;

    this.context = new MiddlewareContext({
      app: options.app,
      middleware: this,
    });
  }

  clone() {
    const clone = new Middleware({
      id: this.id,
      name: this.name,
      app: this.app,
      files: {},
      updatedAt: this.updatedAt,
      configDir: this.configDir,
    });

    return clone;
  }

  /*
  async optionsModule(options: { customRequire: any }) {
    const filename = `app_${this.context.app.name}/middleware_${this.name}/options`;
    const sandbox: any = {};
    const exports: any = {};

    sandbox.console = global.console;
    sandbox.process = global.process;
    sandbox.require = options.customRequire;

    sandbox.exports = exports;
    sandbox.module = {
      exports: exports,
      filename: filename,
      id: filename,
      parent: module.parent,
      require: options.customRequire,
    };
    sandbox.global = sandbox;

    return this.eval({ sandbox, scriptContent: this.optionsScript });
  }

  async ruleModule(options: { customRequire: any }) {
    const filename = `app_${this.context.app.name}/rule_${this.rule.name}`;
    const sandbox: any = {};
    const exports: any = {};

    sandbox.console = global.console;
    sandbox.process = global.process;
    sandbox.require = options.customRequire;

    sandbox.exports = exports;
    sandbox.module = {
      exports: exports,
      filename: filename,
      id: filename,
      parent: module.parent,
      require: options.customRequire,
    };
    sandbox.global = sandbox;

    return this.eval({ sandbox, scriptContent: this.rule.ruleScript });
  }

  ruleRequire(packagesMap: Map<string, any>) {
    return (packageName: string) => {
      return packagesMap.get(packageName);
    };
  }

  eval(options: { sandbox: any; scriptContent: string }) {
    const sandbox = options.sandbox;

    const vmOptions = {
      filename: sandbox.module.filename,
    };

    const script = new vm.Script(options.scriptContent, vmOptions);
    script.runInNewContext(sandbox, vmOptions);

    return sandbox.module.exports;
  }

  async getPackageMap(script: string, installPath: string) {
    const packagesMap = new Map<string, any>();

    const requires = (matcheRequires(script) as {
      name: string;
      string: string;
    }[]).map((match) => match.name);

    debug('requires', requires);

    let installPackages: string[] = [];
    requires.map((packageName) => {
      if (require('module').builtinModules.includes(packageName)) {
        packagesMap.set(packageName, require(packageName));
      } else {
        installPackages.push(packageName);
      }
    });

    debug('installPackages', installPackages);

    const npmImportAsync = createNpmImportAsync(installPath);
    const packages = (await npmImportAsync(installPackages)) as any[];

    packages.map((packageContent, index) => {
      packagesMap.set(installPackages[index], packageContent);
    });

    return packagesMap;
  }
  */

  async init(middleware?: MiddlewareFunction) {
    /*
    const ruleInstallPath = path.join(this.configDir, 'rule', this.rule.id);
    const rulePackagesMap = await this.getPackageMap(
      this.rule.ruleScript,
      ruleInstallPath,
    );
    const ruleRequire = this.ruleRequire(rulePackagesMap);

    const ruleModule = await this.ruleModule({ customRequire: ruleRequire });
    if (typeof ruleModule !== 'function') {
      throw new Error('rule script does not export function');
    }

    const optionsInstallPath = path.join(this.configDir, 'middleware', this.id);
    const optionsPackagesMap = await this.getPackageMap(
      this.optionsScript,
      optionsInstallPath,
    );
    const optionsRequire = this.ruleRequire(optionsPackagesMap);

    const optionModule = await this.optionsModule({
      customRequire: optionsRequire,
    });
    if (typeof optionModule !== 'function') {
      throw new Error('option script does not export function');
    }

    this.context.options = optionModule;
    */

    // @TODO build & require from files
    // @ts-ignore
    middleware(this.context);
  }

  connection(socket: net.Socket | UdpProxySocket) {
    if (this.app.type === 'HTTP' || this.app.type === 'TCP') {
      this.context.emit('connection', socket);
    } else if (this.app.type === 'UDP') {
      this.context.emit('udpProxySocket', socket);
    }
  }

  destroy() {
    this.context.emit('destroy');
    // @ts-ignore
    if (this.context.next) {
      // @ts-ignore
      this.context.next.context.emit('destroy');
    }
  }
}
