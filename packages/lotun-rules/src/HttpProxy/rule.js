/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

const http = require('http');
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
  const server = http.createServer();

  ctx.on('connection', function(socket) {
    server.emit('connection', socket);
  });

  function createProxyServer(options) {
    return createLotunProxyServer(options);
  }

  await ctx.options(ctx, server, createProxyServer);
};
