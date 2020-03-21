'use strict';

/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */
const http = require('http');
const { ServerResponse } = require('http');
const httpProxy = require('http-proxy@1.18.0');
const auth = require('http-auth@4.1.2');

function createLotunProxyServer(options) {
  const proxy = httpProxy.createProxyServer(options);

  if (options.agent) {
    const agent = options.agent;
    const originalWeb = proxy.web.bind(proxy);
    const originalWs = proxy.ws.bind(proxy);

    proxy.web = function(...args) {
      const { remoteAddress, remotePort } = args[0].socket;
      if (typeof agent.setRemoteOptions === 'function') {
        agent.setRemoteOptions({ remoteAddress, remotePort });
      }
      return originalWeb(...args);
    };

    proxy.ws = function(...args) {
      const { remoteAddress, remotePort } = args[0].socket;
      if (typeof agent.setRemoteOptions === 'function') {
        agent.setRemoteOptions({ remoteAddress, remotePort });
      }
      return originalWs(...args);
    };
  }
  return proxy;
}

/**
 * @param {RuleContext} ctx
 */
module.exports = async function rule(ctx) {
  const server = http.createServer();

  ctx.on('connection', function(socket) {
    server.emit('connection', socket);
  });

  const agent = ctx.nextMiddlewareAgent({ keepAlive: true });

  const proxy = createLotunProxyServer({
    target: 'http://next.middleware',
    agent,
  });

  const httpAuth = await ctx.options(ctx, auth);

  server.on('request', function(req, res) {
    httpAuth.check((req, res) => {
      proxy.web(req, res);
    })(req, res);
  });

  server.on('upgrade', function(req, socket, head) {
    const res = new ServerResponse({
      httpVersionMajor: req.httpVersionMajor,
      httpVersionMinor: req.httpVersionMinor,
    });

    res.assignSocket(socket);
    res.shouldKeepAlive = false;

    res.on('finish', function() {
      res.detachSocket(socket);
      socket.destroySoon();
    });

    httpAuth.check((req, res) => {
      res.detachSocket(socket);
      proxy.ws(req, socket, head);
    })(req, res);
  });
};
