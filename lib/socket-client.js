const net = require('net')
const systemInfo = require('./system-info')
const WebSocket = require('uws')
const WebsocketStream = require('./websocket-stream')

process.on('unhandledRejection', function(reason, p){
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging here
});


const createSocketStreamConnection = function() {
  const socketStream = new WebSocket(`${lotunClient.connectUrl}/wsDeviceStream?deviceToken=${lotunClient.deviceToken}`)
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

    const socket = new net.Socket()
    socket.pipe(stream).pipe(socket)
    const forward = header.data.forward

    socket.connect({
      host: forward.hostname,
      port: forward.port
    })

    socket.on('error', function(err) {
      console.log('socket.error', err)
       stream.handleError(err)
       socket.destroy()
    })

    socket.on('unpipe', () => {
      console.log('socket.unpipe')
    })

    socket.on('end', () => {
      console.log('socket.end')
    })

    socket.on('finish', () => {
      console.log('socket.finish')
    })

    stream.on('unpipe', () => {
      console.log('stream.unpipe')
    })

    stream.on('end', () => {
      console.log('stream.end')
      //socket.end()
      //socket.end()
      //socket.destroy()
    })

    stream.on('finish', () => {
      console.log('stream.finish')
    })

  })

  return socketStream
}

const appPrivate = require('./appPrivate')
const createSocketConnection = function() {
  //console.log(`${lotunClient.connectUrl}/wsClient?deviceToken=${lotunClient.deviceToken}`)
  const socket = new WebSocket(`${lotunClient.connectUrl}/wsDeviceMaster?deviceToken=${lotunClient.deviceToken}`)
  let socketStream = null


  socket.on('open', async function() {
    console.log('open')
    //socketStream = createSocketStreamConnection()
  })

  socket.on('message', async function(data) {
    const message = JSON.parse(data)
    if (message.type === 'closeReason') {
      lotunClient.emit('closeReason', message)
    }

    if (message.type === 'ready') {
      lotunClient.emit('ready')
    }

    if (message.type === 'accepted') {
      lotunClient.emit('open')
      let sysInfo = await systemInfo()
      socket.send(JSON.stringify({
        type: 'systemInfo',
        data: sysInfo
      }))
    }

    if (message.type === 'appsPrivate') {
      appPrivate.closeAll()
      message.data.forEach((one) => {
        appPrivate.createServer(one)
      })
    }

    if (message.type === 'getDeviceStream') {
      console.log('getDeviceStream')
      createSocketStreamConnection()
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
