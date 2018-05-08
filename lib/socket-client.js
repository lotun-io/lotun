const net = require('net')
const systemInfo = require('./system-info')
const WebSocket = require('uws')
const WebsocketStream = require('./websocket-stream')

process.on('unhandledRejection', function(reason, p){
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});


const createSocketStreamConnection = function() {
  const socketStream = new WebSocket(`${lotunClient.connectUrl}/wsClientStream?deviceToken=${lotunClient.deviceToken}`)
  const websocketStream = new WebsocketStream(socketStream)

  socketStream.on('open', () => {
    console.log('socketStream open')
  })

  socketStream.on('error', () => {
    console.log('socketStream error')
  })

  socketStream.on('close', () => {
    //websocketStream.destroy()
    console.log('socketStream close')
  })

  appPrivate.websocketStream = websocketStream

  websocketStream.on('stream', function(options) {
    console.log('new stream')
    const stream = options.stream
    const header = options.header

    const s = new net.Socket()
    s.pipe(stream).pipe(s)
    const forward = header.data.forward

    s.connect({
      host: forward.hostname,
      port: forward.port
    })

    s.on('error', function(err) {
       stream.handleError(err)
       s.destroy()
    })
  })

  return socketStream
}

const appPrivate = require('./appPrivate')
const createSocketConnection = function() {
  //console.log(`${lotunClient.connectUrl}/wsClient?deviceToken=${lotunClient.deviceToken}`)
  const socket = new WebSocket(`${lotunClient.connectUrl}/wsClient?deviceToken=${lotunClient.deviceToken}`)
  let socketStream = null


  socket.on('open', async function() {
    console.log('open')
    socketStream = createSocketStreamConnection()

    lotunClient.emit('open')
    let sysInfo = await systemInfo()
    socket.send(JSON.stringify({
      type: 'systemInfo',
      data: sysInfo
    }))
  })

  socket.on('ready', function() {
    lotunClient.emit('ready')
    //createClientStream()
  })

  socket.on('message', function(data) {
    const message = JSON.parse(data)
    if (message.type === 'closeReason') {
      lotunClient.emit('closeReason', message)
    }

    if (message.type === 'ready') {
      lotunClient.emit('ready')
    }

    if (message.type === 'appsPrivate') {
      appPrivate.closeAll()
      message.data.forEach((one) => {
        appPrivate.createServer(one)
      })
    }
  })

  /*
  socket.on('ping', function() {
    //console.log('ping')
  })
  */

  socket.on('error', function(err) {
    console.log('error', err)
    lotunClient.emit('error', err)
    socket.emit('close', err)
  })

  socket.on('close', function(err) {
    if (socketStream) {
      socketStream.close()
    }

    console.log('close', err)
    lotunClient.emit('close', err)
    setTimeout(function() {
      createSocketConnection()
    }, 5000)
  })
}

let lotunClient = null
module.exports = {
  createConnection: function(lc) {
    lotunClient = lc
    createSocketConnection()
  }
}
