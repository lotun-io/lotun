const io = require('socket.io-client')
const ss = require('socket.io-stream')
const net = require('net')
const systemInfo = require('./system-info')

const onRequest = function(stream, options) {
  stream.on('error', function(err) {
    s.emit(err)
    stream.destroy()
  })

  stream.on('end', function() {
    stream.destroy()
  })

  const s = new net.Socket()

  s.on('connect', function() {
    s.pipe(stream).pipe(s)
  })

  s.on('error', function(err) {
    stream.emit('error', err)
    s.destroy()
  })

  s.on('end', function() {
    s.destroy()
  })

  s.connect({
    host: options.forward.hostname,
    port: options.forward.port
  })
}

const createSocketConnection = function() {
  const socket = io(lotunClient.connectUrl,
    {
      transportOptions: {
        polling: {
          extraHeaders: {
            'Authorization': lotunClient.deviceToken,
          }
        }
      }
    }
  )

  socket.on('entryMap', function(options) {

  })

  socket.on('error', function(err) {
    lotunClient.emit('error', err)
    socket.disconnect()
    socket.close()
    socket.destroy()

    setTimeout(function() {
      createSocketConnection()
    }, 10000)
  })

  socket.on('connect', async function() {
    ss(socket).on('request', onRequest)
    /*
    console.log('Device connected, setup your device from web app')
    console.log(`https://dashboard.dev.lotun.io`)
    */
    let sysInfo = await systemInfo()
    socket.emit('systemInfo', sysInfo)
    lotunClient.emit('connect')
  })

  socket.on('disconnect', function(reason) {
    lotunClient.emit('disconnect', reason)
    ss(socket).removeListener('request', onRequest)
  })
}

let lotunClient = null
module.exports = {
  createConnection: function(lc) {
    lotunClient = lc
    createSocketConnection()
  }
}
