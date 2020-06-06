import { Agent as HttpAgent, AgentOptions } from 'http';
import net from 'net';
import { RemoteInfo } from 'dgram';
import { EventEmitter } from 'events';
import path from 'path';
import vm from 'vm';
import { debug as debugRoot } from './utils';
import { createNpmImportAsync } from './runtime-install';

const matcheRequires = require('match-requires');

const debug = debugRoot.extend('Middleware');

import { createSocketPair, createSocket } from './Socket';
import { Duplex, Stream } from 'stream';
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

    this.socket = createSocket(options.duplex);
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
  private __remoteOptions: { remoteAddress?: string; remotePort?: string } = {};
  private ctx: RuleContext;
  constructor(ctx: RuleContext, opts?: AgentOptions) {
    super(opts);
    this.ctx = ctx;
  }

  setRemoteOptions(options: { remoteAddress?: string; remotePort?: string }) {
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

export interface RuleContext {
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

export class RuleContext extends EventEmitter {
  private next!: Middleware;
  options!: (...args: any[]) => any;
  app: App;

  constructor(options: { app: App }) {
    super();
    this.app = options.app;

    this.nextMiddleware = this.nextMiddleware.bind(this);
    this.nextMiddlewareSocket = this.nextMiddlewareSocket.bind(this);
    this.nextMiddlewareAgent = this.nextMiddlewareAgent.bind(this);
  }

  nextMiddleware(socket: net.Socket | UdpProxySocket) {
    this.next.connection(socket);
  }

  nextMiddlewareSocket(options: {
    remoteAddress?: string;
    remotePort?: string;
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
  rule: Rule;
  app: App;
  optionsScript: string;
  context: RuleContext;
  configDir: string;

  constructor(options: {
    id: string;
    app: App;
    rule: Rule;
    name: string;
    optionsScript: string;
    configDir: string;
  }) {
    this.id = options.id;
    this.name = options.name;
    this.rule = options.rule;
    this.app = options.app;
    this.optionsScript = options.optionsScript;
    this.configDir = options.configDir;

    this.context = new RuleContext({
      app: options.app,
    });
  }

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

  async init() {
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

    await ruleModule(this.context);
  }

  connection(duplex: net.Socket | UdpProxySocket) {
    if (this.app.type === 'HTTP' || this.app.type === 'TCP') {
      this.context.emit('connection', duplex);
    } else if (this.app.type === 'UDP') {
      this.context.emit('udpProxySocket', duplex);
    }
  }

  destroy() {
    this.context.emit('destroy');
  }
}
