const { Duplex } = require('stream');
const EventEmitter = require('events');

class DuplexStream extends Duplex {
  constructor(options) {
    super({
      // allowHalfOpen: false
    });

    this.websocketStream = options.websocketStream;
    this.streamId = options.streamId;
    this._started = false;

    this.type = options.type;

    this.on('end', () => {
      this._endCalled = true;
      if (this._endCalled && this._finishCalled) {
        this._cleanUp();
        this.removeAllListeners();
      }
    });

    this.on('finish', () => {
      this._finishCalled = true;
      if (this._eandCalled && this._finishCalled) {
        this._cleanUp();
        this.removeAllListeners();
      }
    });
  }

  _cleanUp() {
    // console.log('cleanUp');
    if (this.websocketStream) {
      if (this._canWrite()) {
        const message = this.websocketStream.constructor.encodeMessage({
          type: 'stream.delete',
          streamId: this.streamId,
        });
        this.websocketStream.socket.send(message);
      }

      this.websocketStream._deleteStream();
    }

    // @TODO
    if (!this.cleanUpCalled && this._canWrite()) {
      // only emit if socket is still open !
      this.emit('cleanUp');
    }

    this.websocketStream = null;
    this.cleanUpCalled = true;
    this.destroy();
  }

  _write(chunk, encoding, callback) {
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage(
        {
          type: 'stream.write',
          streamId: this.streamId,
        },
        chunk,
      );
      this.websocketStream.socket.send(message);
      this._cb = callback;
    } else {
      // @TODO error ?!
      callback();
    }
  }

  _canWrite() {
    const canWrite =
      this.websocketStream && this.websocketStream.socket.readyState === this.websocketStream.socket.OPEN;
    if (!canWrite) {
      // console.log('cannot write !')
    }
    return canWrite;
    // return true
  }

  _read() {
    if (this._started) {
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.ack',
        streamId: this.streamId,
      });
      this.websocketStream.socket.send(message);
    }
  }

  _final(callback) {
    // console.log('DuplexStream.final');
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.final',
        streamId: this.streamId,
      });
      this.websocketStream.socket.send(message);
    }

    callback();
    this.resume();
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
      this.websocketStream.socket.send(message);
    }
    // this.destroy(err);
  }
}

class WebsocketStream extends EventEmitter {
  constructor(socket) {
    super();
    this.lastStreamId = 0;
    this.socket = socket;
    this.streams = new Map();

    if (this.socket.readyState === 0) {
      this.socket.on('open', () => {
        this.emit('open');
      });
    }

    this.socket.on('error', err => {
      for (const value of this.streams.values()) {
        value.destroy();
      }

      this.emit('error', err);
      this.socket.terminate();
      this.socket.removeAllListeners();
      this.removeAllListeners();

      this.socket = null;
    });

    this.socket.on('close', () => {
      for (const value of this.streams.values()) {
        value.destroy();
      }

      this.emit('close');
      this.socket.terminate();
      this.socket.removeAllListeners();
      this.removeAllListeners();
    });

    this.socket.on('message', data => {
      const message = this.constructor.decodeMessage(data);
      // console.log('message.type', message.header.type)
      // console.log('socket.message.'+message.header.type, name ,message.header.streamId)

      if (message.header.type === 'stream.create') {
        const stream = this._createStream(message.header.streamId);

        this.emit('stream', {
          stream,
          header: message.header,
        });
      }

      if (message.header.type === 'stream.delete') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          stream._cleanUp();
        }
      }

      if (message.header.type === 'stream.write') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          stream._started = true;
          if (!stream._readableState.ended) {
            stream.push(message.buffer);
          }
        }
      }

      if (message.header.type === 'stream.ack') {
        const stream = this._getStream(message.header.streamId);
        if (stream && stream._cb) {
          stream._cb();
          stream._cb = null;
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
    });
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

    this.streams.set(streamId, stream);
    return stream;
  }

  _generateStreamId() {
    this.lastStreamId++;
    if (this.lastStreamId === Number.MAX_SAFE_INTEGER) {
      this.lastStreamId = 0;
    }
    return this.lastStreamId;
  }

  createStream(data) {
    const header = {
      type: 'stream.create',
      streamId: this._generateStreamId(),
      data,
    };

    const stream = this._createStream(header.streamId);
    const message = this.constructor.encodeMessage(header);
    this.socket.send(message);
    return stream;
  }

  static decodeMessage(arrayBuffer) {
    let view = new Uint8Array(arrayBuffer);
    const message = Buffer.allocUnsafe(arrayBuffer.byteLength);
    for (let i = 0; i < message.length; ++i) {
      message[i] = view[i];
    }

    view = null;

    let index = 0;
    while (message[index] > 47 && message[index] < 58) {
      index++;
      if (index > 9) {
        throw Error('Bad payload');
      }
    }
    // @TODO use buffer.slice !
    const length = Number(message.toString('utf8', 0, index));
    const header = JSON.parse(message.toString('utf8', index, index + length));
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

module.exports = WebsocketStream;
