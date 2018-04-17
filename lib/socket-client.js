'use strict'

const io = require('socket.io-client')
const ss = require('socket.io-stream')
const net = require('net')
const si = require('systeminformation')
const defaultGateway = require('default-gateway')
const arp = require('arp')
const os = require('os')

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
    host: options.hostname,
    port: options.port
  })
}

const createConnection = function(options) {
  const socket = io('http://api.dev.lotun.io',
    {
      transportOptions: {
        polling: {
          extraHeaders: {
            'Authorization': options.token,
          }
        }
      }
    })

  /*
  socket.on('connect_error', function(err) {

  })
  */

  socket.on('error', function(err) {
    if (err === 'not authorized' && lastError != err) {
      console.log('Not authorized, please pair your device using this url')
      console.log(`https://dashboard.dev.lotun.io/add-device?token=${encodeURIComponent(options.token)}&name=${encodeURIComponent(options.hostname)}`)
    }

    lastError = err
    socket.disconnect()
    socket.destroy()
    setTimeout(function() {
      createConnection(connectionOptions)
    }, 10000)
  })

  socket.on('connect', function() {
    console.log('Device connected, setup your device from web app')
    console.log(`https://dashboard.dev.lotun.io`)

    // @TODO if error try
    Promise.all([
      si.system(),
      si.bios(),
      si.baseboard(),
      si.osInfo(),
      si.versions(),
      si.cpu(),
      si.cpuFlags(),
      si.graphics(),
      si.networkInterfaces(),
      si.networkInterfaceDefault(),
      si.memLayout(),
      si.diskLayout(),
      defaultGateway.v4()
        .then((res) => {
          return new Promise((resolve) => {
            arp.getMAC(res.gateway, (err, mac) => {
              if (err) {

              } else {
                res.mac = mac
              }
              resolve(res)
            })
          })
        })
    ]).then((res) => {
      const data = {}
      data.system = res[0]
      data.bios = res[1]
      data.baseboard = res[2]
      data.os = res[3]
      data.versions = res[4]
      data.cpu = res[5]
      data.cpu.flags = res[6]
      data.graphics = res[7]
      data.net = res[8]
      data.netDefault = data.net.filter((one) => {
        if (one.iface === res[9]) {
          return true
        }
        return false
      }).shift()
      data.memLayout = res[10]
      data.diskLayout = res[11]
      data.gatewayDefault = res[12]
      data.userInfo = os.userInfo()
      socket.emit('sysInfo', data)
    })

    ss(socket).on('request', onRequest)
  })

  socket.on('disconnect', function() {
    console.log('disconnect')
    ss(socket).removeListener('request', onRequest)
  })
}

let connectionOptions = null
let lastError = null
module.exports = function(options) {
  connectionOptions = options
  createConnection(connectionOptions)
}
