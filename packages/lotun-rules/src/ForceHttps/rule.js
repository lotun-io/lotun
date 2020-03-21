'use strict';

/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

const SSL_PORT = '443';

const http = require('http');
const { IncomingMessage, ServerResponse } = require('http');
const httpProxy = require('http-proxy@1.18.0');

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
  const options = await this.options(ctx);

  const server = http.createServer();

  ctx.on('connection', function(socket) {
    server.emit('connection', socket);
  });

  const agent = ctx.nextMiddlewareAgent({ keepAlive: true });

  const proxy = createLotunProxyServer({
    target: 'http://next.middleware',
    agent,
  });

  /**
   * @param {IncomingMessage} req
   */
  function getHttpsUrl(req) {
    const hostParts = (req.headers['host'] || '').split(':');
    const hostname = hostParts[0];

    const entryPointType = ctx.app.entryPoint.type;

    if (entryPointType === 'HOSTNAME') {
      url = `https://${hostname}${req.url}:${SSL_PORT}`;
    }
  }

  /**
   * @param {ServerResponse} res
   * @param {number} code
   * @param {string} location
   */
  function redirect(res, statusCode, location) {
    res.statusCode = statusCode;
    res.setHeader('Location', location);
    res.end();
  }

  server.on('request', function(req, res) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      const location = getHttpsUrl(req);
      redirect(res, 302, location);
      return;
    }

    proxy.web(req, res);
  });

  server.on('upgrade', function(req, socket, head) {
    if (req.headers['x-forwarded-proto'] !== 'https') {
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

      const location = getHttpsUrl(req);
      redirect(res, 302, location);
      return;
    }

    proxy.ws(req, socket, head);
  });
};
