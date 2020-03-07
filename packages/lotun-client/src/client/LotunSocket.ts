import Debug from 'debug';
import { Duplex, Stream } from 'stream';
import { EventEmitter } from 'events';
import { BPMux } from 'bpmux';
import WebSocket from 'ws';
import si from 'systeminformation';
import { MessageStream } from './MessageStream';

const debug = Debug('LotunSocket');

type HandshakeType = 'MESSAGE_STREAM' | 'MULTIPLEX_STREAM';
type HandshakeData = any;

export type LotunReasonError =
  | 'INVALID_DEVICE_TOKEN'
  | 'UNPAIRED_DEVICE_TOKEN'
  | 'NETWORK_ERROR';

export type LotunMessageType = {
  connect: {};
  clientInfo: {
    version: string;
    os?: si.Systeminformation.OsData;
  };
  test: {
    id: string;
  };
  test2: {
    id: number;
  };
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
  private messageStream?: MessageStream;
  private ws: WebSocket;
  private wsStream: Duplex;
  private bpMux: BPMux;

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
      parse_handshake_data: data => {
        if (data.length > 0) {
          return JSON.parse(data.toString());
        }
        return null;
      },
    });

    this.bpMux.on('handshake', (duplex, handshakeData) => {
      if (handshakeData) {
        const data = handshakeData as { type: HandshakeType };

        if (data.type === 'MESSAGE_STREAM') {
          this.createMessageStream(duplex);
          return;
        }

        if (data.type === 'MULTIPLEX_STREAM') {
          this.emit('stream', duplex, handshakeData);
          return;
        }

        duplex.destroy(new Error('Unknown duplex type'));
      }
    });

    this.bpMux.on('error', err => {
      debug('bpMux.error', err);
    });

    this.wsStream.on('close', () => {
      debug('wsStream.close');
      this.wsStream.removeAllListeners();
      // @ts-ignore
      this.bpMux.removeAllListeners();
    });

    this.wsStream.on('error', err => {
      debug('wsStream.error', err);
    });

    this.once('createMessageStream', () => {
      this.messageStream!.on('message', (type, payload) => {
        this.emit('message', type, payload);
      });

      this.messageStream!.on('error', err => {
        debug('messageStream.error', err);
        this.destroy();
      });
    });
  }

  // @TODO types
  createDuplex(payload: any) {
    const data: { type: HandshakeType; payload: any } = {
      type: 'MULTIPLEX_STREAM',
      payload: payload,
    };
    return this.bpMux.multiplex({
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
        type: 'MESSAGE_STREAM',
      };

      duplex = this.bpMux.multiplex({
        handshake_data: Buffer.from(JSON.stringify(data)),
      });

      duplex.on('error', () => {
        duplex.destroy();
      });

      duplex.on('close', () => {
        duplex.removeAllListeners();
      });
    }

    this.messageStream = new MessageStream(duplex);
    this.emit('createMessageStream');
  }

  private async getClientInfo() {
    const pjson = require('../../package.json');
    const version = pjson.version as string;

    const os = await si.osInfo().catch(err => {
      debug(err);
      return undefined;
    });

    return {
      version,
      os,
    };
  }

  async sendClientInfo() {
    const clientInfo = await this.getClientInfo();
    this.messageStream?.send('clientInfo', clientInfo);
  }

  sendConnect() {
    this.messageStream?.send('connect', {});
  }

  async destroy() {
    debug('destroy', this.ws.readyState);
    this.ws.terminate();

    if (this.messageStream) {
      this.messageStream.destroy();
    }

    this.removeAllListeners();
  }
}
