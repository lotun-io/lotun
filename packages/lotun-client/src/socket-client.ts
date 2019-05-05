import net from 'net';
import tls from 'tls';
import WebSocket from 'ws';
import { LotunClient } from './client';
import { getSystemInfo } from './system-info';
import { WebsocketStream, ClientError } from './wsStream/WsStream';
import { version as WsStreamVersion } from './wsStream/WsStream';

const clientVersion = require('../package.json').version;

/*
const HttpsProxyAgent = require('https-proxy-agent');
const usProxyAgent = new HttpsProxyAgent('http://12.131.182.225:38606');
*/

// let lotunClient: LotunClient;
// const appPrivate = require('./app-private');

const createSocketConnection = (lotunClient: LotunClient) => {
  const ws = new WebSocket(`${lotunClient.connectUrl}`, {
    handshakeTimeout: 10000,
    headers: {
      authorization: lotunClient.deviceToken || '',
      'x-ws-stream-version': WsStreamVersion,
      'x-lotun-client-version': clientVersion,
    },
  });

  const wsStream = new WebsocketStream(ws);

  wsStream.on('stream', (options: any) => {
    // console.log('stream');
    const { stream, header } = options;
    const forward = header;

    // console.log('forward', forward);

    let socket: net.Socket;
    if (forward.type === 'TCP') {
      socket = net.connect(forward.socketOptions);
    } else if (forward.type === 'TLS') {
      socket = tls.connect({
        ...forward.socketOptions,
        ...forward.tlsOptions,
      });
    } else {
      // not supported
      stream.destroy();
      return;
    }

    const socketOnError = (err: any) => {
      // console.log('socket.error');
      stream.sendError(err);
      stream.destroy();
      socket.destroy();
    };

    const socketOnTimeout = () => {
      // socket.close();
      socket.destroy();
    };

    socket.on('error', socketOnError);
    socket.on('timeout', socketOnTimeout);
    socket.once('close', () => {
      socket.removeListener('error', socketOnError);
      socket.removeListener('timeout', socketOnTimeout);
    });

    if (forward.timeout) {
      socket.setTimeout(forward.timeout);
    }

    if (forward.keepAlive) {
      socket.setKeepAlive(true, forward.keepAlive);
    }

    socket.pipe(stream).pipe(socket);
  });

  wsStream.on('message', (message: any) => {
    if (message.type === 'connect') {
      lotunClient.emit('connect');
    }
  });

  function heartbeat() {
    // @ts-ignore
    clearTimeout(ws.pingTimeout);
    // @ts-ignore
    ws.pingTimeout = setTimeout(() => {
      ws.terminate();
    }, 15000);
  }

  const wsOnOpen = async () => {
    heartbeat();

    wsStream.send({
      type: 'clientInfo',
      data: {
        systemInfo: await getSystemInfo(),
      },
    });
  };

  const wsOnPing = async () => {
    heartbeat();
  };

  const wsReconnectOnClose = (code: any, reason: any) => {
    lotunClient.emit('close', code, reason);

    setTimeout(() => {
      createSocketConnection(lotunClient);
    }, 5000);
  };

  const wsOnError = () => {
    ws.terminate();
  };

  ws.on('open', wsOnOpen);
  ws.on('ping', wsOnPing);
  ws.on('error', wsOnError);

  ws.on('close', async (code, reason) => {
    if (code === 1006) {
      try {
        // @ts-ignore
        reason = ws._req.res.headers['x-lotun-close-reason'];
      } catch {}
    }

    if (!reason) {
      reason = <ClientError>'CONNECTION_ERROR';
    }

    wsReconnectOnClose(code, reason);
  });
};

export function createConnection(lc: LotunClient) {
  createSocketConnection(lc);
}
