const Koa = require('koa');
const app = new Koa();
const net = require('net');
const util = require('util')
const events = require('events')
const http = require('http')
const httpProxy = require('http-proxy')
const Mitm = require("mitm")
const mitm = Mitm()
mitm.disable()

const proxy = httpProxy.createProxyServer({})

proxy.on('error', (err) => {
  console.log('proxy.error')
  console.log(err)
})

function SocketHttpServer(cb) {
  events.EventEmitter.call(this)

  this.on('connection', http._connectionListener)
  if (cb) {
    this.on('request', cb)
  }
}

util.inherits(SocketHttpServer, events.EventEmitter)


const createServer = function(options) {
  return new SocketHttpServer(options)
}

const httpServer = createServer((req, res) => {
  //console.log('httpServer.request')
  koaHandler(req, res)
})

httpServer.on('clientError', (err, socket) => {
  console.log('clientError', err)
})

/*

proxy.web(httpStream.req, httpStream.res, {
  target
})
*/

mitm.on("connection", (proxyServer) => {
  //console.log('mitm.connection')
  httpServer.emit('connection', proxyServer)
  //socket.pipe(proxyServer).pipe(socket)
})

const server = net.createServer((socket) => {
  //console.log('socket')

  socket.on('data', (d) => {
    //console.log('data !')
    //console.log(d.toString())
  })

  mitm.enable()
  const proxySocket = net.createConnection({port: 8124})
  mitm.disable()

  proxySocket.pipe(socket).pipe(proxySocket)
  //httpServer.emit('connection', socket)
})

server.listen(4444)


app.use(async ctx => {
  ctx.body = 'Hello World 4444 ' + ctx.request.url + JSON.stringify(ctx.request.header,null, 2)
})

const koaHandler = app.callback()

//app.listen(4444)
