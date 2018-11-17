const { Duplex } = require('stream');
const EventEmitter = require('events');

class DuplexStream extends Duplex {
  constructor(options) {
    super({
      allowHalfOpen: false,
    });

    this.___destroyCalled = false;
    this.___cleanUpCalled = false;
    this.___writeWaitForAck = false;
    this.___shouldPushMoreSent = false;

    this.websocketStream = options.websocketStream;
    this.streamId = options.streamId;

    let endCalled = false;
    let finishCalled = false;

    const duplexOnEnd = () => {
      endCalled = true;
      if (endCalled && finishCalled) {
        this._cleanUp();
      }
    };

    const duplexOnFinish = () => {
      finishCalled = true;
      if (endCalled && finishCalled) {
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
    // console.log('DuplexStream.destroy');
    if (!this.___destroyCalled) {
      if (!this._readableState.ended) {
        this.push(null);
      }
      if (this._cb) {
        this._cb();
      }
    }
  }

  _cleanUp() {
    // console.log('cleanUp');
    if (!this.___cleanUpCalled) {
      this.___cleanUpCalled = true;
      this.websocketStream._deleteStream(this.streamId);
      this.websocketStream = null;
      this.emit('close');
    }
  }

  _handleShouldPushMore(shouldPushMore) {
    if (shouldPushMore === false && this.___shouldPushMoreSent === false) {
      if (this._canWrite()) {
        this.___shouldPushMoreSent = true;
        const message = this.websocketStream.constructor.encodeMessage({
          type: 'stream.writeWaitForAck',
          streamId: this.streamId,
        });
        this.websocketStream.ws.send(message);
      }
    }
  }

  /*
  _writev (chunks, callback) {
    debug(`${this.socket._name}: hey, I'm sending you all buffered data`)
    let chunk = chunks.reduce((prev, next) =>
      Buffer.concat([prev.chunk, next.chunk].filter((b) => b)))
    this._send(DATA, chunk)
    this._cb = callback
  }
  */

  _write(chunk, _, callback) {
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage(
        {
          type: 'stream.write',
          streamId: this.streamId,
        },
        chunk,
      );
      this.websocketStream.ws.send(message);
      if (this.___writeWaitForAck) {
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
    if (!canWrite) {
      // console.log('cannot write !');
    }
    return canWrite;
    // return true
  }

  _read() {
    if (this.___shouldPushMoreSent) {
      if (this._canWrite()) {
        this.___shouldPushMoreSent = false;
        const message = this.websocketStream.constructor.encodeMessage({
          type: 'stream.ack',
          streamId: this.streamId,
        });
        this.websocketStream.ws.send(message);
      }
    }
  }

  _final(callback) {
    // console.log('DuplexStream.final');
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.final',
        streamId: this.streamId,
      });
      this.websocketStream.ws.send(message);
    }
    callback();
  }

  sendError(err) {
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.error',
        streamId: this.streamId,
        data: {
          code: err.code,
          message: err.message,
        },
      });
      this.websocketStream.ws.send(message);
    }
  }
}

class WebsocketStream extends EventEmitter {
  constructor(ws, type) {
    super();
    this.lastStreamId = 0;
    this.ws = ws;
    this.type = type;
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
      // @TODO !
      this.removeAllListeners();
      this.ws.removeListener('message', this.wsOnMessage);
      this.ws.removeListener('close', this.wsOnClose);
      this.ws.removeListener('error', this.wsOnMessage);
      this.ws = null;
    };

    this.wsOnMessage = data => {
      let message = null;
      try {
        message = this.constructor.decodeMessage(data);
      } catch (err) {
        this.emit('decodeError', err);
        return;
      }

      // console.log('message.type', message.header.type);
      // console.log('message.header', message.header);
      /* console.log(
        message.buffer
          .toString()
          .replace(/\r/g, 'R')
          .replace(/\n/g, 'N'),
      );
      */
      // console.log('socket.message.'+message.header.type, name ,message.header.streamId)

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
          if (!stream._readableState.ended) {
            const shouldPushMore = stream.push(message.buffer);
            stream._handleShouldPushMore(shouldPushMore);
          }
        }
      }

      if (message.header.type === 'stream.writeWaitForAck') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          stream.___writeWaitForAck = true;
        }
      }

      if (message.header.type === 'stream.ack') {
        const stream = this._getStream(message.header.streamId);
        if (stream && stream._cb) {
          const cb = stream._cb();
          stream._cb = null;
          stream.___writeWaitForAck = false;
          cb();
        }
      }

      if (message.header.type === 'stream.final') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          if (!stream._readableState.ended) {
            stream.push(null);
          }
        }
      }

      if (message.header.type === 'stream.error') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          const err = new Error(String(message.header.data.message));
          err.code = String(message.header.data.code);
          stream.emit('error', err);
        }
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
    const message = this.constructor.encodeMessage(header);
    this.ws.send(message);
    return stream;
  }

  send(data) {
    const message = this.constructor.encodeMessage({
      type: 'message',
      data,
    });
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
    // @TODO use buffer.slice !
    const length = Number(message.slice(0, index).toString('utf8'));
    const header = JSON.parse(message.slice(index, index + length).toString('utf8'));
    const buffer = message.slice(index + length);

    return {
      header,
      buffer,
    };
  }

  static encodeMessage(headerObject, buffer = Buffer.from('')) {
    // console.log('encodeMessage');
    // console.log(buffer.toString().replace(/\r/g, 'R').replace(/\n/g, 'N'),);
    const header = Buffer.from(JSON.stringify(headerObject));
    const length = Buffer.from(String(header.length));
    return Buffer.concat([length, header, buffer]);
  }
}

module.exports = WebsocketStream;
