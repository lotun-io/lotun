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


app.use(async ctx => {
  ctx.body = 'Hello World 4444 ' + ctx.request.url + JSON.stringify(ctx.request.header,null, 2)
})

const koaHandler = app.callback()

app.listen(4444)
