const { PassThrough, Duplex } = require('stream');
const EventEmitter = require('events');
const util = require('util');

class DuplexStream extends Duplex {
  constructor(options) {
    super();

    this.websocketStream = options.websocketStream;
    this.streamId = options.streamId;
    this._started = false

    this._endCalled = false
    this._finishCalled = false

    this.type = options.type

    if (this.type == 'local') {
      this.on('end', () => {
        this._cleanUp()
      })
    }

    if (this.type == 'remote') {
      this.on('final', () => {
        this._cleanUp()
      })
    }
  }

  _cleanUp() {
    if (this._cleanUpCalled) {
      console.log('cleanUp called !')
    }

    /*
    const message = this.websocketStream.constructor.encodeMessage({
      type: 'stream.cleanUp',
      streamId: this.streamId,
    })

    this.websocketStream.socket.send(message)
    */

    if (this._cb) {
      this._cb()
      this._cb = null
    }

    this.websocketStream._deleteStream(this.streamId);
    this.websocketStream = null

    this._cleanUpCalled = true

    this.destroy()
    this.emit('cleanUp')
    this.removeAllListeners()
  }

  _write(chunk, encoding, callback) {
    if (this._canWrite()) {
      const message = this.websocketStream.constructor.encodeMessage({
        type: 'stream.write',
        streamId: this.streamId,
      }, chunk);
      this.websocketStream.socket.send(message);
    }
    this._cb = callback
    //callback()
  }

  _canWrite() {
    const canWrite = (this.websocketStream) && (this.websocketStream.socket.readyState === this.websocketStream.socket.OPEN)
    if (!canWrite) {
      //console.log('cannot write !')
    }
    return canWrite
    //return true
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
    //console.log('DuplexStream.flush');
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
    //this.destroy(err);
  }
}

//util.inherits(DuplexStream, PassThrough, Duplex)

class WebsocketStream extends EventEmitter {
  constructor(socket) {
    super();
    this.lastStreamId = 0;
    this.socket = socket;
    //this.streams = new Map();
    this.stream = null;

    if (this.socket.readyState === 0) {
      this.socket.on('open', () => {
        this.emit('open');
      });
    }

    this.socket.on('error', (err) => {
      if (this.stream) {
        this.stream.destroy()
      }

      this.emit('error', err);
      this.socket.removeAllListeners();
      this.removeAllListeners();
    });

    this.socket.on('close', () => {
      // close all streams !
      this.emit('close');

      if (this.stream) {
        this.stream.end()
        this.stream.destroy()
      }

      this.socket.removeAllListeners();
      this.removeAllListeners();
    });

    this.socket.on('message', (data) => {
      const message = this.constructor.decodeMessage(data);
      //console.log('message.type', message.header.type)
      //console.log('socket.message.'+message.header.type, name ,message.header.streamId)
      if (message.header.type === 'stream.cleanUp') {

      }

      if (message.header.type === 'stream.create') {
        const stream = this._createStream(message.header.streamId, 'remote')

        this.emit('stream', {
          stream,
          header: message.header,
        });
      }

      if (message.header.type === 'stream.write') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          stream._started = true
          stream.push(message.buffer);
        }
      }

      if (message.header.type === 'stream.ack') {
        const stream = this._getStream(message.header.streamId);
        if (stream && stream.cb) {
          stream._cb()
          stream._cb = null
        }
      }

      if (message.header.type === 'stream.final') {
        const stream = this._getStream(message.header.streamId);
        if (stream) {
          stream.push(null);
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
    if (!this.stream) {
      //console.log('stream not found')
      //throw new Error('stream not found')
    }
    return this.stream
    //return this.streams.get(streamId);
  }

  _deleteStream(streamId) {
    this.stream = null
    //console.log('delete stream !', streamId);
    //this.streams.delete(streamId);
  }

  _createStream(streamId, type) {
    //console.log('createStream');
    //console.log(streamId);
    if (this.stream) {
      this.stream.end()
      this.stream.destroy()
      this.stream.once('cleanUp', () => {
        console.log('cleanUp')
      })
      this.stream = null
      //console.log('Stream not ended yet!')
      //throw new Error('Stream not ended yet!')
    }

    const stream = new DuplexStream({
      streamId,
      websocketStream: this,
      type
    });

    /*
    stream.once('end', () => {
      console.log('_createStream.stream.end')
      stream.websocketStream = null
      stream.removeAllListeners()
      this.stream = null
    })
    */

    this.stream = stream

    //this.streams.set(streamId, stream);

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

    const stream = this._createStream(header.streamId, 'local')
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
