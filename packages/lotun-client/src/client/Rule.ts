import { debug as debugRoot } from './utils';
import path from 'path';
import { createNpmImportAsync } from './runtime-install';
import { EventEmitter } from 'events';
import { Agent as HttpAgent, IncomingMessage, AgentOptions } from 'http';
import net from 'net';
import vm from 'vm';
import { RemoteInfo } from 'dgram';

const matcheRequires = require('match-requires');

const debug = debugRoot.extend('Rule');

import {
  createSocketPair,
  createHttpAgent,
  CreateHttpAgentOptions,
} from './utils';

export type App = {
  id: string;
  name: string;
  type: 'HTTP' | 'TCP' | 'UDP';
  entryPoint: {
    id: string;
    type: 'HOSTNAME' | 'EXTERNAL_PORT' | 'DEVICE_PORT';
  };
};

class NextMiddlewareAgent extends HttpAgent {
  private __remoteOptions: { remoteAddress?: string; remotePort?: string } = {};
  private ctx: RuleContext;
  constructor(ctx: RuleContext, opts?: AgentOptions) {
    super(opts);
    this.ctx = ctx;
  }

  setRemoteOptions(options: { remoteAddress?: string; remotePort?: string }) {
    this.__remoteOptions = options;
    return this;
  }

  createConnection(
    options: net.SocketConnectOpts,
    callback: (err: Error | null, result?: net.Socket) => void,
  ) {
    try {
      const socket = createSocketPair(
        { ...options, ...this.__remoteOptions },
        remoteSocket => {
          this.ctx.nextMiddleware(remoteSocket);
        },
      );

      // @ts-ignore
      this.__remoteAddress = undefined;
      callback(null, socket);
    } catch (err) {
      callback(err);
    }
  }
}

export interface RuleContext {
  on(event: 'connection', listener: (socket: net.Socket) => void): this;
  once(event: 'connection', listener: (socket: net.Socket) => void): this;
  on(
    event: 'message',
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  once(
    event: 'message',
    listener: (msg: Buffer, rinfo: RemoteInfo) => void,
  ): this;
  on(event: 'destroy', listener: () => void): this;
  once(event: 'destroy', listener: () => void): this;
}

export class RuleContext extends EventEmitter {
  options!: (...args: any[]) => any;
  app: App;
  private nextRule!: Rule;

  constructor(options: { app: App }) {
    super();
    this.app = options.app;

    this.nextMiddleware = this.nextMiddleware.bind(this);
    this.nextMiddlewareSocket = this.nextMiddlewareSocket.bind(this);
    this.nextMiddlewareAgent = this.nextMiddlewareAgent.bind(this);
  }

  nextMiddleware(...options: any[]) {
    this.nextRule.connection(...options);
  }

  nextMiddlewareSocket(options: {
    remoteAddress?: string;
    remotePort?: string;
  }): net.Socket {
    const socket = createSocketPair({ port: 80, ...options }, remoteSocket => {
      this.nextMiddleware(remoteSocket);
    });

    return socket;
  }

  nextMiddlewareAgent(opts?: AgentOptions) {
    return new NextMiddlewareAgent(this, opts);
  }

  createHttpAgent(target: string, options: CreateHttpAgentOptions) {
    return createHttpAgent(target, options);
  }
}

export class Rule {
  id: string;
  name: string;
  version: string;
  ruleScript: string;
  optionsScript: string;
  installPath: string;
  context: RuleContext;
  requirePackages = new Map<string, any>();

  constructor(options: {
    id: string;
    name: string;
    version: string;
    ruleScript: string;
    optionsScript: string;
    app: App;
    configDir: string;
  }) {
    this.id = options.id;
    this.name = options.name;
    this.version = options.version;
    this.ruleScript = options.ruleScript;
    this.optionsScript = options.optionsScript;

    this.installPath = path.join(options.configDir, 'rules', this.id);

    this.context = new RuleContext({
      app: options.app,
    });
  }

  async optionsModule(options: { customRequire: any }) {
    const filename = `app_${this.context.app.name}/rule_${this.name}/options`;
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
    const filename = `app_${this.context.app.name}/rule_${this.name}`;
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

    return this.eval({ sandbox, scriptContent: this.ruleScript });
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

  async getPackageMap(script: string) {
    const packagesMap = new Map<string, any>();

    const requires = (matcheRequires(script) as {
      name: string;
    }[]).map(match => match.name);

    let installPackages: string[] = [];
    requires.map(packageName => {
      if (require('module').builtinModules.includes(packageName)) {
        packagesMap.set(packageName, require(packageName));
      } else {
        installPackages.push(packageName);
      }
    });

    const npmImportAsync = createNpmImportAsync(this.installPath);
    const packages = (await npmImportAsync(installPackages)) as any[];

    packages.map((packageContent, index) => {
      packagesMap.set(installPackages[index], packageContent);
    });

    return packagesMap;
  }

  async init() {
    const rulePackagesMap = await this.getPackageMap(this.ruleScript);
    const ruleRequire = this.ruleRequire(rulePackagesMap);

    const ruleModule = await this.ruleModule({ customRequire: ruleRequire });
    if (typeof ruleModule !== 'function') {
      throw new Error('rule script does not export function');
    }

    const optionsPackagesMap = await this.getPackageMap(this.optionsScript);
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

  connection(...options: any[]) {
    if (this.context.app.type === 'HTTP' || this.context.app.type === 'TCP') {
      this.context.emit('connection', ...options);
    } else if (this.context.app.type === 'UDP') {
      this.context.emit('message', ...options);
    }
  }

  destroy() {
    this.context.emit('destroy');
    for (const key of this.requirePackages.keys()) {
      this.requirePackages.delete(key);
    }
  }
}
