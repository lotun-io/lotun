const { PassThrough, Duplex } = require('stream');
const EventEmitter = require('events');
const util = require('util');

class DuplexStream extends Duplex {
  constructor(options) {
    super();
    PassThrough.call(this)
    this.websocketStream = options.websocketStream;
    this.streamId = options.streamId;
  }

  _write(chunk, encoding, callback) {
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.write',
        streamId: this.streamId,
      }, chunk);
      this.websocketStream.socket.send(message);
    }
    callback();
  }

  _canWrite() {
    const canWrite = (this.websocketStream) && (this.websocketStream.socket.readyState === this.websocketStream.socket.OPEN)
    if (canWrite) {
      //console.log('can write !')
    }
    return canWrite
  }

  /*
  _final(callback) {
    console.log('final !')
    callback()
  }


  _destroy(err, callback) {
    console.log('destroy !')
    callback(err)
  }
  */

  _flush(callback) {
    //console.log('DuplexStream.flush');
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.flush',
        streamId: this.streamId,
      });
      this.websocketStream.socket.send(message);
    }

    this.websocketStream._deleteStream(this.streamId);
    this.websocketStream = null;

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
    this.destroy(err);
  }
}

util.inherits(DuplexStream, PassThrough)

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

    this.socket.on('error', (err) => {
      this.emit('error', err);
      this.socket.removeAllListeners();
      this.removeAllListeners();
    });

    this.socket.on('close', () => {
      // close all streams !
      this.emit('close');
      for (const value of this.streams.values()) {
        value.end();
      }
      this.socket.removeAllListeners();
      this.removeAllListeners();
    });

    this.socket.on('message', (data) => {
      const message = this.constructor.decodeMessage(data);
      let name = null
      if (this._getStream(message.header.streamId)) {
        name = this._getStream(message.header.streamId).name
      }
      //console.log('socket.message.'+message.header.type, name ,message.header.streamId)
      if (message.header.type === 'stream.create') {
        const stream = this._createStream(message.header.streamId);

        this.emit('stream', {
          stream,
          header: message.header,
        });
      }

      if (message.header.type === 'stream.write') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          stream.push(message.buffer);
        }
      }

      if (message.header.type === 'stream.flush') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          this._getStream(message.header.streamId).end();
        }
      }

      if (message.header.type === 'stream.error') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          const err = new Error(message.header.data.message);
          err.code = message.header.data.code;
          stream.emit('error', err)
        }
      }
    });
  }

  _getStream(streamId) {
    return this.streams.get(streamId);
  }

  _deleteStream(streamId) {
    //console.log('delete stream !', streamId);
    this.streams.delete(streamId);
  }

  _createStream(streamId) {
    //console.log('createStream');
    //console.log(streamId);
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
