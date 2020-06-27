import { MiddlewareFunction } from '@lotun/middleware';

import http from 'http';
import httpProxy from 'http-proxy';

function unwrap<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error('Should not happen');
  }
  return value;
}

export function forceHttps(
  options: {
    redirectLocation?: (req: http.IncomingMessage) => string;
  } = {},
): MiddlewareFunction {
  return async (ctx) => {
    const statusCode = 302;
    let { redirectLocation } = options;

    if (typeof redirectLocation !== 'function') {
      redirectLocation = function (req) {
        const hostParts = (req.headers['host'] || '').split(':');
        const hostname = hostParts[0];

        return `https://${hostname}${req.url}`;
      };
    }

    const nextMiddlewareAgent = ctx.nextMiddlewareAgent({ keepAlive: true });

    function setRemoteOptions(req: http.IncomingMessage) {
      nextMiddlewareAgent.setRemoteOptions(req.socket);
      return nextMiddlewareAgent;
    }

    const proxy = httpProxy.createProxyServer({
      target: 'http://next.middleware',
      agent: nextMiddlewareAgent,
    });

    const server = http.createServer();
    server.keepAliveTimeout = 0;
    server.timeout = 0;

    ctx.on('connection', function (socket) {
      server.emit('connection', socket);
    });

    function redirect(
      res: http.ServerResponse,
      statusCode: number,
      location: string,
    ) {
      res.statusCode = statusCode;
      res.setHeader('Location', location);
      res.end();
    }

    server.on('request', function (req, res) {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        const location = unwrap(redirectLocation)(req);
        redirect(res, statusCode, location);
        return;
      }

      setRemoteOptions(req);
      proxy.web(req, res);
    });

    server.on('upgrade', function (req, socket, head) {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        const res = new http.ServerResponse({
          httpVersionMajor: req.httpVersionMajor,
          httpVersionMinor: req.httpVersionMinor,
        } as http.IncomingMessage);

        res.assignSocket(socket);
        res.shouldKeepAlive = false;

        res.on('finish', function () {
          res.detachSocket(socket);
          socket.destroySoon();
        });

        const location = unwrap(redirectLocation)(req);
        redirect(res, statusCode, location);
        return;
      }

      setRemoteOptions(req);
      proxy.ws(req, socket, head);
    });
  };
}
