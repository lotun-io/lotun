const { Duplex, PassThrough } = require('stream')
const net = require('net')
const EventEmitter = require('events')

class DuplexStream extends PassThrough {
  constructor(options) {
    super()
    this.websocketStream = options.websocketStream
    this.streamId = options.streamId
    this.hadError = false

    this.on('error', function(err) {
      console.log(err.code)
      console.log(err.message)
      const message = this.websocketStream.encodeMessage({
        type: 'stream.error',
        streamId: this.streamId,
        data: {
          code: err.code,
          message: err.message
        }
      })

      this.websocketStream.socket.send(message)
    })
  }

  // implementation writeable
  _write(chunk, encoding, callback) {
    if (this.websocketStream.socket.readyState !== this.websocketStream.socket.OPEN) {
      callback()
      return
    }

    const message = this.websocketStream.encodeMessage({
      'type': 'stream.write',
      'streamId': this.streamId
    }, chunk)

    this.websocketStream.socket.send(message)
    callback()
  }

  _flush(callback) {
    console.log('Duplex stream flush')
    if (this.hadError) {
      console.log('hadError')
      callback()
      return
    }

    const message = this.websocketStream.encodeMessage({
      type: 'stream.flush',
      streamId: this.streamId
    })

    this.websocketStream.socket.send(message)
    callback()
  }

  handleError(err) {
    this.hadError = true
    const message = this.websocketStream.encodeMessage({
      type: 'stream.error',
      streamId: this.streamId,
      data: {
        code: err.code,
        message: err.message
      }
    })

    this.websocketStream.socket.send(message)
    this.destroy()
  }
}

class WebsocketStream extends EventEmitter {
  constructor(socket) {
    super()
    this.lastStreamId = 0
    this.socket = socket
    this.streams = {}

    this.socket.on('message', (data) => {
      const message = this.decodeMessage(data)
      if (message.header.type === 'stream.create') {
        console.log(message.header.streamId)

        const stream = this._createStream(message.header.streamId)

        this.emit('stream', {
          stream,
          header: message.header
        })
      }

      if (message.header.type === 'stream.write') {
        const stream = this._getStream(message.header.streamId)
        if (!stream._readableState.ended) {
          this._getStream(message.header.streamId).push(message.buffer)
        }
      }

      if (message.header.type === 'stream.end') {
        this._getStream(message.header.streamId).end(message.buffer)
      }

      if (message.header.type === 'stream.flush') {
        this._getStream(message.header.streamId).end()
        this._getStream(message.header.streamId).destroy()
      }

      if (message.header.type === 'stream.error') {
        const stream = this._getStream(message.header.streamId)
        const err = new Error(message.header.data.message)
        err.code = message.header.data.code
        stream.emit('remoteError', err)
      }
    })
  }

  _getStream(streamId) {
    return this.streams[streamId]
  }

  _createStream(streamId) {
    console.log('_createStream')
    this.streams[streamId] = new DuplexStream({
      streamId: streamId,
      websocketStream: this
    })

    return this.streams[streamId]
  }

  _generateStreamId() {
    this.lastStreamId++
    if (this.lastStreamId === Number.MAX_SAFE_INTEGER) {
      this.lastStreamId = 0
    }
    return this.lastStreamId
  }

  createStream(data) {
    console.log('createStream')
    const header = {
      type: 'stream.create',
      streamId: this._generateStreamId(),
      data
    }

    console.log(header)

    const stream = this._createStream(header.streamId)
    const message = this.encodeMessage(header)
    this.socket.send(message.toString())
    return stream
  }

  decodeMessage(message) {
    message = Buffer.from(message)
    let index = 0
    while ( message[index] > 47 && message[index] < 58 ) {
      index++
      if (index > 9) {
        throw Error('Bad payload')
      }
    }
    const length = Number(message.toString('utf8',0, index))
    const header = JSON.parse(message.toString('utf8', index, index+length))
    const buffer = message.slice(index+length)
    return {
      header,
      buffer
    }
  }

  encodeMessage(headerObject, buffer) {
    if (!buffer) {
      buffer = Buffer.from("")
    }

    const header = Buffer.from(JSON.stringify(headerObject))
    const length = Buffer.from(String(header.length))
    console.log('encodeMessage')
    return Buffer.concat([length, header, buffer])
  }
}

module.exports = WebsocketStream
