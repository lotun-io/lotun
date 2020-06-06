import net, { isIP } from 'net';
import { Duplex } from 'stream';
import { DuplexPair } from './DuplexPair';

let JSStreamSocket: any;

try {
  JSStreamSocket = require('internal/js_stream_socket');
} catch (err) {
  console.log(err);
}

export function shimNetSocket(socket: Duplex): net.Socket {
  return new JSStreamSocket(socket);
}

export type CreateSocketPairOptions = {
  remoteAddress?: string;
  remotePort?: string;
};

export function createSocket(
  duplex: Duplex,
  options: CreateSocketPairOptions = {},
) {
  const socket = shimNetSocket(duplex);

  socket.on('error', () => {
    socket.destroy();
  });

  setRemoteOptions(socket, options);

  return socket;
}

export function createSocketPair(options: CreateSocketPairOptions = {}) {
  const { socket1, socket2 } = new DuplexPair({ allowHalfOpen: false });

  const socket = createSocket(socket1);
  const remoteSocket = createSocket(socket2, options);

  return { socket, remoteSocket };
}

function setRemoteOptions(
  socket: net.Socket,
  options: CreateSocketPairOptions,
) {
  if (options.remoteAddress) {
    Object.defineProperty(socket, 'remoteAddress', {
      get: function () {
        return options.remoteAddress;
      },
      set: function () {},
    });
  }

  if (options.remotePort) {
    Object.defineProperty(socket, 'remotePort', {
      get: function () {
        return options.remotePort;
      },
      set: function () {},
    });
  }

  let remoteFamily: string | undefined = undefined;
  if (options.remoteAddress) {
    const ipVersion = isIP(options.remoteAddress);
    if (ipVersion) {
      remoteFamily = `IPv${ipVersion}`;
    }
  }

  if (remoteFamily) {
    Object.defineProperty(socket, 'remoteFamily', {
      get: function () {
        return remoteFamily;
      },
      set: function () {},
    });
  }
}
