'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const stream_1 = require('stream');
const events_1 = __importDefault(require('events'));
exports.version = '1.0.0';
class DuplexStream extends stream_1.Duplex {
  constructor(options) {
    super({
      allowHalfOpen: false,
    });
    this.___destroyCalled = false;
    this.___cleanUpCalled = false;
    this.___endCalled = false;
    this.___finishCalled = false;
    this.___writePauseSent = false;
    this.___writePause = false;
    this.___writeResumeSent = false;
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
  _handleShouldPushMore(shouldPushMore) {
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
  _write(chunk, _, callback) {
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
  _final(callback) {
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
  sendError(err) {
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
exports.DuplexStream = DuplexStream;
class WebsocketStream extends events_1.default {
  constructor(ws) {
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
  _getStream(streamId) {
    return this.streams.get(streamId);
  }
  _deleteStream(streamId) {
    this.streams.delete(streamId);
  }
  _createStream(streamId) {
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
  createStream(data) {
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
  send(data) {
    // @ts-ignore
    const message = this.constructor.encodeMessage({
      type: 'message',
      data,
    });
    // @ts-ignore
    this.ws.send(message);
  }
  static decodeMessage(message) {
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
  static encodeMessage(headerObject, buffer = Buffer.from('')) {
    const header = Buffer.from(JSON.stringify(headerObject));
    const length = Buffer.from(String(header.length));
    return Buffer.concat([length, header, buffer]);
  }
}
exports.WebsocketStream = WebsocketStream;
//# sourceMappingURL=WsStream.js.map
