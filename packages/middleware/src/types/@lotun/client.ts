declare module '@lotun/client/DuplexPair' {
  /// <reference types="node" />
  import { Duplex, DuplexOptions } from 'stream';
  class DuplexSocket extends Duplex {
      constructor(options?: DuplexOptions);
      _read(): void;
      _write(chunk: any, encoding: any, callback: any): void;
      _final(callback: any): void;
  }
  export class DuplexPair {
      socket1: DuplexSocket;
      socket2: DuplexSocket;
      constructor(options?: DuplexOptions);
  }
  export {};

}
declare module '@lotun/client/EntryPoint' {
  import { LotunSocket } from '@lotun/client/LotunSocket';
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
      private app;
      private lotunSocket;
      private tcpServer?;
      private udpServer?;
      private activeConnections;
      private udpProxyMap;
      constructor(options: {
          lotunSocket: LotunSocket;
          app: App;
      });
      init(): Promise<void>;
      destroy(): Promise<void>;
  }
  export {};

}
declare module '@lotun/client/ForwardPoint' {
  import { App } from '@lotun/client/Middleware';
  export class ForwardPoint {
      private app;
      private middlewares;
      private configDir;
      private activeConnections;
      constructor(options: {
          app: App;
          configDir: string;
      });
      connection(...options: any[]): void;
      addMiddleware(options: {
          id: string;
          name: string;
          files: Record<string, string>;
          updatedAt: string;
      }, priority: string): Promise<void>;
      sortMiddlewares(): void;
      destroy(): Promise<void>;
  }

}
declare module '@lotun/client/LotunApps' {
  /// <reference types="node" />
  import { Duplex } from 'stream';
  import { LotunSocket, LotunMessageApps } from '@lotun/client/LotunSocket';
  export class LotunApps {
      private lotunSocket;
      private configDir;
      private queue;
      private entryPointsMap;
      private forwardPointsMap;
      constructor(options: {
          lotunSocket: LotunSocket;
          configDir: string;
      });
      messageApps(apps: LotunMessageApps): void;
      duplex(duplex: Duplex, handshakeData: unknown): void;
      createDuplex(payload: any): Duplex;
      upsertEntryPoints(apps: LotunMessageApps): Promise<void>;
      upsertForwardPoints(apps: LotunMessageApps): Promise<void>;
      getForwardPoint(id: string): void;
      deleteMissingEntryPoints(ids: string[]): Promise<void>;
      deleteMissingForwardPoints(ids: string[]): Promise<void>;
      destroy(): Promise<void>;
  }

}
declare module '@lotun/client/LotunClient' {
  /// <reference types="node" />
  import { EventEmitter } from 'events';
  import { LotunConfig } from '@lotun/client/LotunConfig';
  import { LotunReasonError } from '@lotun/client/LotunSocket';
  export interface LotunClient {
      on(event: 'connect', listener: () => void): this;
      on(event: 'disconnect', listener: (reason: LotunReasonError, repeating: boolean) => void): this;
  }
  export class LotunClient extends EventEmitter {
      private ws;
      private lotunSocket;
      private apps;
      private options;
      private lastDisconnectReason;
      constructor(config: LotunConfig);
      connect(): void;
      terminate(): Promise<void>;
      private onDisconnect;
      reconnect(): Promise<void>;
      destroy(): Promise<void>;
  }

}
declare module '@lotun/client/LotunConfig' {
  type LotunConfigObject = {
      deviceToken: string;
  };
  export class LotunConfig {
      configPath: string;
      configDir: string;
      data?: LotunConfigObject;
      constants: {
          API_URL: string;
          DEVICE_TUNNEL_URL: string;
          DASHBOARD_URL: string;
          LOTUN_ENV: string;
      };
      private api;
      constructor(options?: {
          configPath?: string;
      });
      setConfig(config: LotunConfigObject): void;
      readConfig(): Promise<LotunConfigObject | null>;
      saveConfig(config: LotunConfigObject): Promise<void>;
      generateDeviceToken(): Promise<string>;
      private readEnv;
  }
  export {};

}
declare module '@lotun/client/LotunSocket' {
  /// <reference types="node" />
  import { Duplex } from 'stream';
  import { EventEmitter } from 'events';
  import WebSocket from 'ws';
  import si from 'systeminformation';
  export { WebSocket };
  type HandshakeData = any;
  export type LotunReasonError = 'INVALID_DEVICE_TOKEN' | 'UNPAIRED_DEVICE_TOKEN' | 'NETWORK_ERROR';
  export type LotunMessageApp = {
      id: string;
      name: string;
      type: 'HTTP' | 'TCP' | 'UDP';
      entryPoint: {
          id: string;
          name: string;
          type: 'HOSTNAME' | 'EXTERNAL_PORT' | 'DEVICE_PORT';
          port: string;
          updatedAt: string;
      };
      middlewares: {
          id: string;
          name: string;
          files: Record<string, string>;
          priority: string;
          updatedAt: string;
      }[];
      updatedAt: string;
  };
  export type LotunMessageApps = LotunMessageApp[];
  export type LotunMessageType = {
      connect: {};
      clientInfo: {
          version: string;
          os?: si.Systeminformation.OsData;
      };
      apps: LotunMessageApps;
  };
  export interface LotunSocket {
      on(event: 'message', listener: (event: keyof LotunMessageType, payload: unknown) => void): this;
      on(event: 'duplex', listener: (duplex: Duplex, handshakeData: HandshakeData) => void): this;
      once(event: 'createMessageStream', listener: () => void): this;
  }
  export class LotunSocket extends EventEmitter {
      private ws;
      private wsStream;
      private bpMux;
      private messageStream?;
      constructor(ws: WebSocket, options?: {
          high_channels?: boolean;
      });
      createDuplex(payload: any): Duplex;
      createMessageStream(stream?: Duplex): void;
      private getClientInfo;
      sendClientInfo(): Promise<void>;
      sendConnect(): void;
      sendApps(data: LotunMessageType['apps']): void;
      destroy(): Promise<void>;
  }

}
declare module '@lotun/client/MessageStream' {
  /// <reference types="node" />
  import { Duplex } from 'stream';
  import { EventEmitter } from 'events';
  export interface MessageStream {
      on(event: 'message', listener: (type: string, payload: unknown) => void): this;
      on(event: 'error', listener: (err: Error) => void): this;
  }
  export class MessageStream extends EventEmitter {
      private jsonStream;
      constructor(duplex: Duplex);
      send(event: string, args: any): boolean;
      destroy(): void;
  }

}
declare module '@lotun/client/Middleware' {
  /// <reference types="node" />
  import { Agent as HttpAgent, AgentOptions } from 'http';
  import net from 'net';
  import { RemoteInfo } from 'dgram';
  import { EventEmitter } from 'events';
  import { Duplex } from 'stream';
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
      on(event: 'message', listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;
      once(event: 'message', listener: (msg: Buffer, rinfo: RemoteInfo) => void): this;
      on(event: 'close', listener: () => void): this;
      once(event: 'close', listener: () => void): this;
  }
  export class UdpProxySocket extends EventEmitter {
      socket: net.Socket;
      rinfo: RemoteInfo;
      private messageStream;
      constructor(options: {
          duplex: Duplex;
          rinfo: RemoteInfo;
      });
      setTimeout(...args: any[]): void;
      send(msg: Buffer): void;
      pause(): void;
      resume(): void;
      destroy(): void;
  }
  export class NextMiddlewareAgent extends HttpAgent {
      private __remoteOptions;
      private ctx;
      constructor(ctx: MiddlewareContext, opts?: AgentOptions);
      setRemoteOptions(options: {
          remoteAddress?: string;
          remotePort?: number;
      }): this;
      createConnection(options: net.SocketConnectOpts, callback: (err: Error | null, result?: net.Socket) => void): net.Socket | undefined;
  }
  export interface MiddlewareContext {
      on(event: 'connection', listener: (socket: net.Socket) => void): this;
      once(event: 'connection', listener: (socket: net.Socket) => void): this;
      on(event: 'udpProxySocket', listener: (udpProxySocket: UdpProxySocket) => void): this;
      once(event: 'udpProxySocket', listener: (udpProxySocket: UdpProxySocket) => void): this;
      on(event: 'destroy', listener: () => void): this;
      once(event: 'destroy', listener: () => void): this;
  }
  export type MiddlewareFunction = (ctx: MiddlewareContext) => Promise<any>;
  export class MiddlewareContext extends EventEmitter {
      private current;
      private next;
      private lastUse?;
      options: (...args: any[]) => any;
      app: App;
      constructor(options: {
          app: App;
          middleware: Middleware;
      });
      use(...args: MiddlewareFunction[]): Promise<void>;
      nextMiddleware(socket: net.Socket | UdpProxySocket): void;
      nextMiddlewareSocket(options: {
          remoteAddress?: string;
          remotePort?: number;
      }): net.Socket;
      nextMiddlewareAgent(opts?: AgentOptions): NextMiddlewareAgent;
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
      });
      clone(): Middleware;
      init(middleware?: MiddlewareFunction): Promise<void>;
      connection(socket: net.Socket | UdpProxySocket): void;
      destroy(): void;
  }

}
declare module '@lotun/client/Queue' {
  export class Queue {
      private maxSimultaneously;
      private __active;
      private __queue;
      constructor(maxSimultaneously?: number);
      enqueue(func: () => any): Promise<any>;
      destroy(): Promise<void>;
  }

}
declare module '@lotun/client/Socket' {
  /// <reference types="node" />
  import net from 'net';
  import { Duplex } from 'stream';
  export function shimNetSocket(socket: Duplex): net.Socket;
  export type CreateSocketPairOptions = {
      remoteAddress?: string;
      remotePort?: number;
  };
  export function createSocketPair(options?: CreateSocketPairOptions): {
      socket: net.Socket;
      remoteSocket: net.Socket;
  };

}
declare module '@lotun/client/index' {
  export * from '@lotun/client/LotunApps';
  export * from '@lotun/client/LotunClient';
  export * from '@lotun/client/LotunConfig';
  export * from '@lotun/client/LotunSocket';
  export * from '@lotun/client/Middleware';
  export * from '@lotun/client/Socket';

}
declare module '@lotun/client/npm/npm-commands-child' {
  export {};

}
declare module '@lotun/client/npm/npm-commands' {
  import npm from 'npm';
  export type ChildMessage = {
      type: 'ready' | 'install' | 'build' | 'success' | 'error';
      data: any;
  };
  export type NpmLoadOpts = Parameters<typeof npm.load>[0];
  export const npmInstall: (npmLoadOpts: NpmLoadOpts) => void;
  export const npmBuild: (npmLoadOpts: NpmLoadOpts) => void;

}
declare module '@lotun/client/runtime-install' {
  export function createNpmImportAsync(installPath: string, npmInstallToOpts?: Object): (packages: string[]) => Promise<unknown[]>;

}
declare module '@lotun/client/utils' {
  import Debug from 'debug';
  export const debug: Debug.Debugger;
  export function getDefaultConfigPath(): string;

}
declare module '@lotun/client' {
  import main = require('@lotun/client/index');
  export = main;
}