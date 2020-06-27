import { MiddlewareFunction } from '@lotun/middleware';

import dgram from 'dgram';

export function udpProxy(options: {
  host?: string;
  port: number;
  createSocket?: () => dgram.Socket;
}): MiddlewareFunction {
  return async (ctx) => {
    let { host, port, createSocket } = options;

    if (!port) {
      throw new Error('Options script must return object with port property');
    }

    if (typeof createSocket !== 'function') {
      createSocket = function () {
        const socket = dgram.createSocket('udp4');
        return socket;
      };
    }

    ctx.on('udpProxySocket', function (udpProxySocket) {
      const socket = createSocket!();

      socket.on('message', (msg) => {
        udpProxySocket.send(msg);
      });

      udpProxySocket.on('message', (msg) => {
        socket.send(msg, port, host);
      });

      udpProxySocket.on('close', () => {
        socket.close();
      });
    });
  };
}
