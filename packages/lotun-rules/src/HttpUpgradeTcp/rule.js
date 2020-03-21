/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

const http = require('http');
const { pipeline } = require('stream');
const { ServerResponse } = require('http');

/**
 * @param {RuleContext} ctx
 */
module.exports = async function rule(ctx) {
  const server = http.createServer();

  ctx.on('connection', function(socket) {
    server.emit('connection', socket);
  });

  server.on('request', function(req, res) {
    req.destroy();
  });

  server.on('upgrade', function(req, socket, head) {
    const res = new ServerResponse({
      httpVersionMajor: req.httpVersionMajor,
      httpVersionMinor: req.httpVersionMinor,
    });

    res.assignSocket(socket);
    res.shouldKeepAlive = false;

    res.statusCode = 101;
    res.setHeader('Connection', 'upgrade');
    res.setHeader('Upgrade', 'websocket');
    res.end();

    res.on('finish', () => {
      res.detachSocket(socket);
      socket.pause();
      socket.unshift(buffer);

      const { remoteAddress, remotePort } = args[0].socket;
      const nextSocket = ctx.nextMiddlewareSocket({
        remoteAddress,
        remotePort,
      });
      pipeline(socket, nextSocket);
      pipeline(nextSocket, socket);
    });
  });

  await ctx.options(ctx);
};
