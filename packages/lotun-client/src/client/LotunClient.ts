import Debug from 'debug';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { GraphQLClient } from 'graphql-request';
import { getSdk } from 'api/sdk';
import { LotunSocket, LotunMessageType, LotunReasonError } from './LotunSocket';

const debug = Debug('LotunClient');

const WS_URL = 'wss://device.lotun.io';
const API_URL = 'https://api.lotun.io/graphql';

export interface LotunClient {
  on(event: 'connect', listener: () => void): this;
  on(
    event: 'disconnect',
    listener: (reason: LotunReasonError, repeating: boolean) => void,
  ): this;
}

export class LotunClient extends EventEmitter {
  private ws!: WebSocket;
  private lotunSocket!: LotunSocket;
  private options!: {
    deviceToken: string;
    wsUrl: string;
    reconnect: boolean;
    apiUrl: string;
  };
  private api!: ReturnType<typeof getSdk>;
  private lastDisconnectReason!: LotunReasonError;

  constructor(options: { wsUrl?: string; apiUrl?: string }) {
    super();

    this.options = {
      wsUrl: options.wsUrl ?? WS_URL,
      apiUrl: options.apiUrl ?? API_URL,
      reconnect: true,
      deviceToken: '',
    };

    const client = new GraphQLClient(`${this.options.apiUrl}`);
    this.api = getSdk(client);
  }

  async generateDeviceToken() {
    const res = await this.api.generateDeviceToken();
    return res.generateDeviceToken.token;
  }

  connect(options: { deviceToken: string; reconnect?: boolean }) {
    debug('connect');
    if (typeof options.reconnect !== 'boolean') {
      options.reconnect = true;
    }

    this.options.reconnect = options.reconnect;
    this.options.deviceToken = options.deviceToken;

    this.ws = new WebSocket(this.options.wsUrl, {
      handshakeTimeout: 10000,
      headers: {
        authorization: this.options.deviceToken,
      },
    });

    this.ws.on('open', () => {
      debug('open');

      this.lotunSocket = new LotunSocket(this.ws);

      this.lotunSocket.on('message', (type, payload) => {
        debug('lotunSocket.message', type, payload);
        if (type === 'connect') {
          const data = payload as LotunMessageType[typeof type];
          this.emit('connect');
        }

        if (type === 'test2') {
          const data = payload as LotunMessageType[typeof type];
        }
      });

      this.lotunSocket.on('duplex', (duplex, handshakeData) => {
        debug('lotunSocket.duplex', handshakeData);
      });

      this.lotunSocket.once('createMessageStream', () => {
        this.lotunSocket.sendClientInfo();
      });
    });

    this.ws.on('error', err => {
      debug('ws.error', err);
    });

    this.ws.on('unexpected-response', (req, res) => {
      debug('ws.unexpected-response');
      this.ws.terminate();
    });

    this.ws.on('close', (code, reason) => {
      debug('ws.close', code, reason);
      if (code === 4000) {
        const errorReason = reason as LotunReasonError;
        this.onDisconnect(errorReason);
      } else {
        this.onDisconnect('NETWORK_ERROR');
      }
    });
  }

  async terminate() {
    this.options.reconnect = false;
    await this.destroy();
  }

  private onDisconnect(reason: LotunReasonError) {
    let repeating = false;
    if (this.lastDisconnectReason === reason) {
      repeating = true;
    }

    this.lastDisconnectReason = reason;
    this.emit('disconnect', reason, repeating);
    this.reconnect();
  }

  async reconnect() {
    await this.destroy();
    if (this.options.reconnect) {
      setTimeout(async () => {
        this.connect({
          deviceToken: this.options.deviceToken,
          reconnect: this.options.reconnect,
        });
      }, 5000);
    }
  }

  async destroy() {
    debug('destroy');
    if (this.lotunSocket) {
      await this.lotunSocket.destroy();
    } else {
      if (this.ws) {
        this.ws.terminate();
      }
    }
    if (this.ws) {
      this.ws.removeAllListeners();
    }
  }
}
