import { MiddlewareFunction } from '@lotun/middleware';

import http from 'http';
import https from 'https';
import url from 'url';
import { default as httpProxyModule } from 'http-proxy';

export function httpProxy(options: {
  createServer?: () => http.Server;
  createProxy?: () => httpProxyModule;
  proxyOptions: (req: http.IncomingMessage) => httpProxyModule.ServerOptions;
}): MiddlewareFunction {
  return async (ctx) => {
    let { proxyOptions, createProxy, createServer } = options;

    const httpAgent = new http.Agent({ keepAlive: true });
    const httpsAgent = new https.Agent({ keepAlive: true });
    const nextMiddlewareAgent = ctx.nextMiddlewareAgent({ keepAlive: true });

    function getDefaultAgent(
      target:
        | httpProxyModule.ServerOptions['target']
        | httpProxyModule.ServerOptions['forward'],
      req: http.IncomingMessage,
    ) {
      if (target === 'http://next.middleware') {
        nextMiddlewareAgent.setRemoteOptions(req.socket);
        return nextMiddlewareAgent;
      }

      if (typeof target === 'string') {
        target = url.parse(target);
      }

      if (target?.protocol === 'https:') {
        return httpsAgent;
      }
      return httpAgent;
    }

    function hasAgent(
      proxy: httpProxyModule & { options?: httpProxyModule.ServerOptions },
      proxyOptions: httpProxyModule.ServerOptions,
    ) {
      return Boolean(proxy.options?.agent) || Boolean(proxyOptions.agent);
    }

    if (typeof proxyOptions !== 'function') {
      throw new Error(
        'Options script must return object with proxyOptions function',
      );
    }

    if (typeof createServer !== 'function') {
      createServer = function () {
        const server = http.createServer();
        server.keepAliveTimeout = 0;
        server.timeout = 0;
        return server;
      };
    }

    if (typeof createProxy !== 'function') {
      createProxy = function () {
        const proxy = httpProxyModule.createProxy();
        return proxy;
      };
    }

    const proxy = createProxy();

    if (proxy.listeners('error').length === 1) {
      proxy.on('error', function (err, req) {
        req.destroy();
      });
    }

    const server = createServer();

    server.on('request', function (req, res) {
      const options = proxyOptions(req) || {};
      if (!hasAgent(proxy, options)) {
        options.agent = getDefaultAgent(options.target || options.forward, req);
      }
      proxy.web(req, res, options);
    });

    server.on('upgrade', function (req, socket, head) {
      const options = proxyOptions(req) || {};
      if (!hasAgent(proxy, options)) {
        options.agent = getDefaultAgent(options.target || options.forward, req);
      }
      proxy.ws(req, socket, head, options);
    });

    ctx.on('connection', function (socket) {
      server.emit('connection', socket);
    });
  };
}
