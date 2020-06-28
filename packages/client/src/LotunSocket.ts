import Debug from 'debug';
import { Duplex } from 'stream';
import { EventEmitter } from 'events';
import { BPMux } from 'bpmux';
import WebSocket from 'ws';
import si from 'systeminformation';
import { MessageStream } from './MessageStream';

export { WebSocket };

const debug = Debug('LotunSocket');

type HandshakeType = 'MESSAGE' | 'MULTIPLEX';
type HandshakeData = any;

export type LotunReasonError =
  | 'INVALID_DEVICE_TOKEN'
  | 'UNPAIRED_DEVICE_TOKEN'
  | 'NETWORK_ERROR';

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
    tgzBase64: string;
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
  on(
    event: 'message',
    listener: (event: keyof LotunMessageType, payload: unknown) => void,
  ): this;
  on(
    event: 'duplex',
    listener: (duplex: Duplex, handshakeData: HandshakeData) => void,
  ): this;

  once(event: 'createMessageStream', listener: () => void): this;
}

export class LotunSocket extends EventEmitter {
  private ws: WebSocket;
  private wsStream: Duplex;
  private bpMux: BPMux;
  private messageStream?: MessageStream;

  constructor(ws: WebSocket, options?: { high_channels?: boolean }) {
    super();
    this.ws = ws;

    this.wsStream = WebSocket.createWebSocketStream(ws, {});

    if (!options) {
      options = {};
    }

    if (typeof options.high_channels !== 'boolean') {
      options.high_channels = false;
    }

    this.bpMux = new BPMux(this.wsStream, {
      parse_handshake_data: (data) => {
        if (data.length > 0) {
          return JSON.parse(data.toString());
        }
        return null;
      },
      peer_multiplex_options: {
        allowHalfOpen: false,
      },
    });

    this.bpMux.on('handshake', (duplex, handshakeData) => {
      if (handshakeData) {
        const data = handshakeData as { type: HandshakeType; payload: any };

        if (data.type === 'MESSAGE') {
          this.createMessageStream(duplex);
          return;
        }

        if (data.type === 'MULTIPLEX') {
          this.emit('duplex', duplex, data.payload);
          return;
        }

        duplex.destroy(new Error('Unknown duplex type'));
      }
    });

    this.bpMux.on('error', (err) => {
      debug('bpMux.error', err);
    });

    this.wsStream.on('close', () => {
      debug('wsStream.close');
    });

    this.wsStream.on('error', (err) => {
      debug('wsStream.error', err);
    });

    this.once('createMessageStream', () => {
      this.messageStream!.on('message', (type, payload) => {
        this.emit('message', type, payload);
      });

      this.messageStream!.on('error', (err) => {
        debug('messageStream.error', err);
        this.destroy();
      });
    });
  }

  createDuplex(payload: any) {
    const data: { type: HandshakeType; payload: any } = {
      type: 'MULTIPLEX',
      payload: payload,
    };
    return this.bpMux.multiplex({
      allowHalfOpen: false,
      handshake_data: Buffer.from(JSON.stringify(data)),
    });
  }

  createMessageStream(stream?: Duplex) {
    if (this.messageStream) {
      throw new Error('MessageStream already exits!');
    }

    let duplex: Duplex;

    if (stream) {
      duplex = stream;
    } else {
      const data: { type: HandshakeType } = {
        type: 'MESSAGE',
      };

      duplex = this.bpMux.multiplex({
        handshake_data: Buffer.from(JSON.stringify(data)),
      });

      duplex.on('error', () => {
        duplex.destroy();
      });
    }

    this.messageStream = new MessageStream(duplex);
    this.emit('createMessageStream');
  }

  private async getClientInfo() {
    const pjson = require('../package.json');
    const version = pjson.version as string;

    const os = await si.osInfo().catch((err) => {
      debug(err);
      return undefined;
    });

    return {
      version,
      os,
    };
  }

  async sendClientInfo() {
    let data: LotunMessageType['clientInfo'];
    data = await this.getClientInfo();
    this.messageStream?.send('clientInfo', data);
  }

  sendConnect() {
    let data: LotunMessageType['connect'] = {};
    this.messageStream?.send('connect', data);
  }

  sendApps(data: LotunMessageType['apps']) {
    this.messageStream?.send('apps', data);
  }

  async destroy() {
    debug('destroy', this.ws.readyState);
    this.ws.terminate();

    if (this.messageStream) {
      this.messageStream.destroy();
    }
  }
}
