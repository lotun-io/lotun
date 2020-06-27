import { MiddlewareFunction } from '@lotun/middleware';

import net from 'net';
import { pipeline } from 'stream';

export function tcpProxy(
  options:
    | net.SocketConnectOpts
    | {
        createSocket: () => net.Socket;
      },
): MiddlewareFunction {
  return async (ctx) => {
    let { createSocket } = options as { createSocket: () => net.Socket };

    if (typeof createSocket !== 'function') {
      createSocket = function () {
        return net.connect(options as net.SocketConnectOpts);
      };
    }

    ctx.on('connection', function (socket) {
      const nextSocket = createSocket();

      pipeline(socket, nextSocket, function () {});
      pipeline(nextSocket, socket, function () {});
    });
  };
}
