import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { LotunApps } from './LotunApps';
import { LotunConfig } from './LotunConfig';
import { LotunSocket, LotunMessageType, LotunReasonError } from './LotunSocket';

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
  private apps!: LotunApps;
  private options!: {
    configDir: string;
    deviceToken: string;
    wsUrl: string;
    reconnect: boolean;
  };

  private lastDisconnectReason: LotunReasonError | undefined;

  constructor(config: LotunConfig) {
    super();

    if (!config.data) {
      throw new Error(
        'LotunConfig property data is missing. Please call setConfig, readConfig or saveConfig function on LotunConfig class.',
      );
    }

    const { DEVICE_TUNNEL_URL } = config.constants;

    this.options = {
      configDir: config.configDir,
      wsUrl: DEVICE_TUNNEL_URL,
      reconnect: true,
      deviceToken: config.data.deviceToken || '',
    };

    this.on('connect', () => {
      this.lastDisconnectReason = undefined;
    });
  }

  connect() {
    this.ws = new WebSocket(this.options.wsUrl, {
      handshakeTimeout: 10000,
      headers: {
        authorization: this.options.deviceToken,
      },
    });

    this.ws.on('open', () => {
      this.lotunSocket = new LotunSocket(this.ws);
      this.apps = new LotunApps({
        lotunSocket: this.lotunSocket,
        configDir: this.options.configDir,
      });

      this.lotunSocket.on('message', (type, payload) => {
        if (type === 'connect') {
          const data = payload as LotunMessageType[typeof type];

          this.emit('connect');
        }

        if (type === 'apps') {
          const data = payload as LotunMessageType[typeof type];
          this.apps.messageApps(data);
        }
      });

      this.lotunSocket.on('duplex', (duplex, handshakeData) => {
        this.apps.duplex(duplex, handshakeData);
      });

      this.lotunSocket.once('createMessageStream', () => {
        this.lotunSocket.sendClientInfo();
      });
    });

    this.ws.on('error', (err) => {
      // debug('ws.error', err);
    });

    this.ws.on('unexpected-response', (req, res) => {
      this.ws.terminate();
    });

    this.ws.on('close', (code, reason) => {
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
        this.connect();
      }, 5000);
    }
  }

  async destroy() {
    if (this.lotunSocket) {
      await this.lotunSocket.destroy();
    } else {
      if (this.ws) {
        this.ws.terminate();
      }
    }

    if (this.apps) {
      await this.apps.destroy();
    }
  }
}
