/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 * @typedef {import('http').Server} HttpServer
 * @typedef {import('http-proxy').ServerOptions} ProxyServerOptions
 * @typedef {import('http-proxy')} ProxyServer
 */

/**
 * @param { RuleContext } ctx
 * @param { HttpServer } server
 * @param { (options: ProxyServerOptions) => ProxyServer } createProxyServer
 * https://www.npmjs.com/package/http-proxy/v/1.18.0
 */
module.exports = async function options(ctx, server, createProxyServer) {
  // pipe to target on device
  const target = 'http://localhost:3000';
  const agent = ctx.createHttpAgent(target, { keepAlive: true });
  // const agent = ctx.nextMiddlewareAgent(target, { keepAlive: true });
  const proxy = createProxyServer({
    target,
    agent,
  });

  proxy.on('error', function(err, req, res) {
    req.destroy();
  });

  server.on('request', function(req, res) {
    proxy.web(req, res);
  });

  server.on('upgrade', function(req, socket, head) {
    proxy.ws(req, socket, head);
  });
};
