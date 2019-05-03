import { Duplex } from 'stream';
import EventEmitter from 'events';
import WebSocket from 'ws';

export const version = '1.0.0';

export type ClientError =
  | 'CLIENT_INFO_INVALID'
  | 'DEVICE_TOKEN_INVALID'
  | 'DEVICE_TOKEN_UNPAIRED'
  | 'INTERNAL_SERVER_ERROR'
  | 'CONNECTION_ERROR';

export interface WsStreamDuplex extends Duplex {
  ___destroyCalled: boolean;
  ___cleanUpCalled: boolean;
  ___endCalled: boolean;
  ___finishCalled: boolean;
  ___writePauseSent: boolean;
  ___writePause: boolean;
  ___writeResumeSent: boolean;

  websocketStream: WebsocketStream | undefined;
  streamId: string;
  _cb: Function | undefined;
}

export class DuplexStream extends Duplex implements WsStreamDuplex {
  ___destroyCalled = false;
  ___cleanUpCalled = false;
  ___endCalled = false;
  ___finishCalled = false;

  ___writePauseSent = false;
  ___writePause = false;
  ___writeResumeSent = false;
  websocketStream: WebsocketStream | undefined;
  streamId: string;
  _cb: Function | undefined;

  constructor(options: any) {
    super({
      allowHalfOpen: false,
    });

    this.websocketStream = options.websocketStream;
    this.streamId = options.streamId;

    const duplexOnEnd = () => {
      this.___endCalled = true;
      if (this.___endCalled && this.___finishCalled) {
        this._cleanUp();
      }
    };

    const duplexOnFinish = () => {
      this.___finishCalled = true;
      if (this.___endCalled && this.___finishCalled) {
        this._cleanUp();
      }
    };

    this.on('end', duplexOnEnd);
    this.on('finish', duplexOnFinish);
    this.once('close', () => {
      this.removeListener('end', duplexOnEnd);
      this.removeListener('finish', duplexOnFinish);
    });
  }

  destroy() {
    if (!this.___destroyCalled) {
      this.___destroyCalled = true;
      if (!this.___endCalled) {
        this.push(null);
      }
    }
  }

  _cleanUp() {
    if (!this.___cleanUpCalled) {
      this.___cleanUpCalled = true;
      if (this.websocketStream) {
        this.websocketStream._deleteStream(this.streamId);
        this.websocketStream = undefined;
      }
      this.emit('close');
    }
  }

  _writeResumed() {
    this.___writePause = false;
    if (this._canWrite() && this.websocketStream && this.websocketStream.ws) {
      // @ts-ignore
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.writeResumed',
        streamId: this.streamId,
      });
      this.websocketStream.ws.send(message);
    }
  }

  _handleShouldPushMore(shouldPushMore: boolean) {
    if (shouldPushMore === false && this.___writePauseSent === false) {
      if (this._canWrite()) {
        this.___writePauseSent = true;
        // @ts-ignore
        const message = this.websocketStream.constructor.encodeMessage({
          type: 'stream.writePause',
          streamId: this.streamId,
        });
        // @ts-ignore
        this.websocketStream.ws.send(message);
      }
    }
  }

  _write(chunk: any, _: any, callback: Function) {
    if (this._canWrite()) {
      // @ts-ignore
      const message = this.websocketStream.constructor.encodeMessage(
        {
          type: 'stream.write',
          streamId: this.streamId,
        },
        chunk,
      );
      // @ts-ignore
      this.websocketStream.ws.send(message);
      if (this.___writePause) {
        this._cb = callback;
      } else {
        callback();
      }
    } else {
      callback();
    }
  }

  _canWrite() {
    const canWrite =
      this.websocketStream &&
      this.websocketStream.ws &&
      this.websocketStream.ws.readyState === this.websocketStream.ws.OPEN;

    return canWrite;
  }

  _read() {
    if (this.___writePauseSent === true && this.___writeResumeSent === false) {
      this.___writeResumeSent = true;
      if (this._canWrite()) {
        // @ts-ignore
        const message = this.websocketStream.constructor.encodeMessage({
          type: 'stream.writeResume',
          streamId: this.streamId,
        });
        // @ts-ignore
        this.websocketStream.ws.send(message);
      }
    }
  }

  _final(callback: Function) {
    if (this._canWrite()) {
      // @ts-ignore
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.final',
        streamId: this.streamId,
      });
      // @ts-ignore
      this.websocketStream.ws.send(message);
    }
    callback();
  }

  sendError(err: any) {
    if (this._canWrite()) {
      // @ts-ignore
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.error',
        streamId: this.streamId,
        data: {
          code: err.code,
          message: err.message,
        },
      });
      // @ts-ignore
      this.websocketStream.ws.send(message);
    }
  }
}

export class WebsocketStream extends EventEmitter {
  ws: WebSocket | undefined;
  type: string;
  lastStreamId: number;
  streams: Map<any, any>;

  wsOnError: (...args: any[]) => void;
  wsOnClose: (...args: any[]) => void;
  wsOnMessage: (...args: any[]) => void;

  constructor(ws: WebSocket) {
    super();
    //@ts-ignore
    if (ws._isServer) {
      this.type = 'server';
    } else {
      this.type = 'client';
    }

    this.lastStreamId = 0;
    this.ws = ws;
    this.streams = new Map();

    this.wsOnError = () => {
      if (this.ws) {
        this.ws.terminate();
      }
    };

    this.wsOnClose = () => {
      for (const value of this.streams.values()) {
        value.destroy();
      }

      this.emit('close');

      this.removeAllListeners();
      if (this.ws) {
        this.ws.removeListener('message', this.wsOnMessage);
        this.ws.removeListener('close', this.wsOnClose);
        this.ws.removeListener('error', this.wsOnMessage);
        this.ws = undefined;
      }
    };

    this.wsOnMessage = data => {
      let message = null;
      try {
        // @ts-ignore
        message = this.constructor.decodeMessage(data);

        if (message.header.type === 'message') {
          this.emit('message', message.header.data);
        }

        if (message.header.type === 'stream.create') {
          const stream = this._createStream(message.header.streamId);

          this.emit('stream', {
            stream,
            header: message.header.data,
          });
        }

        if (message.header.type === 'stream.write') {
          const stream = this._getStream(message.header.streamId);
          if (stream) {
            if (!stream.___endCalled) {
              const shouldPushMore = stream.push(message.buffer);
              stream._handleShouldPushMore(shouldPushMore);
            }
          }
        }

        if (message.header.type === 'stream.writePause') {
          const stream = this._getStream(message.header.streamId);
          if (stream) {
            stream.___writePause = true;
          }
        }

        if (message.header.type === 'stream.writeResumed') {
          const stream = this._getStream(message.header.streamId);
          if (stream) {
            stream.___writePauseSent = false;
            stream.___writeResumeSent = false;
          }
        }

        if (message.header.type === 'stream.writeResume') {
          const stream = this._getStream(message.header.streamId);
          if (stream) {
            stream._writeResumed();
          }

          if (stream && stream._cb) {
            const cb = stream._cb;
            stream._cb = null;

            if (!stream.___finishCalled) {
              cb();
            }
          }
        }

        if (message.header.type === 'stream.final') {
          const stream = this._getStream(message.header.streamId);
          if (stream) {
            if (!stream.___endCalled) {
              stream.push(null);
            }
          }
        }

        if (message.header.type === 'stream.error') {
          const stream = this._getStream(message.header.streamId);
          if (stream) {
            const err = new Error(String(message.header.data.message));
            // @ts-ignore
            err.code = String(message.header.data.code);
            stream.emit('error', err);
          }
        }
      } catch (err) {
        this.emit('decodeError', err);
      }
    };

    this.ws.on('error', this.wsOnError);
    this.ws.on('close', this.wsOnClose);
    this.ws.on('message', this.wsOnMessage);
  }

  _getStream(streamId: string) {
    return this.streams.get(streamId);
  }

  _deleteStream(streamId: string) {
    this.streams.delete(streamId);
  }

  _createStream(streamId: string) {
    const stream = new DuplexStream({
      streamId,
      websocketStream: this,
    });

    stream.pause();
    this.streams.set(streamId, stream);
    return stream;
  }

  _generateStreamId() {
    this.lastStreamId++;
    if (this.lastStreamId === Number.MAX_SAFE_INTEGER) {
      this.lastStreamId = 0;
    }
    return `${this.type}/${this.lastStreamId}`;
  }

  createStream(data: any) {
    const header = {
      type: 'stream.create',
      streamId: this._generateStreamId(),
      data,
    };

    const stream = this._createStream(header.streamId);
    // @ts-ignore
    const message = this.constructor.encodeMessage(header);
    // @ts-ignore
    this.ws.send(message);
    return stream;
  }

  send(data: any) {
    // @ts-ignore
    const message = this.constructor.encodeMessage({
      type: 'message',
      data,
    });
    // @ts-ignore
    this.ws.send(message);
  }

  static decodeMessage(message: any) {
    let index = 0;
    while (message[index] > 47 && message[index] < 58) {
      index++;
      if (index > 9) {
        throw Error('Bad payload');
      }
    }

    const length = Number(message.slice(0, index).toString('utf8'));
    const header = JSON.parse(message.slice(index, index + length).toString('utf8'));
    const buffer = message.slice(index + length);

    return {
      header,
      buffer,
    };
  }

  static encodeMessage(headerObject: any, buffer = Buffer.from('')) {
    const header = Buffer.from(JSON.stringify(headerObject));
    const length = Buffer.from(String(header.length));
    return Buffer.concat([length, header, buffer]);
  }
}
