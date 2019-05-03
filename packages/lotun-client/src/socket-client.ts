import net from 'net';
import tls from 'tls';
import WebSocket from 'ws';
import { LotunClient } from './client';
import { getSystemInfo } from './system-info';

const clientVersion = require('../package.json').version;

// const WebsocketStream = require(process.cwd() + '/../lotun-be/lib/core/server/common/WebsocketStream.js');
import { WebsocketStream, ClientError } from './wsStream/WsStream';
const WebsocketStreamVersion = require(`${__dirname}/wsStream/WsStream`).version;

/*
const HttpsProxyAgent = require('https-proxy-agent');
const usProxyAgent = new HttpsProxyAgent('http://12.131.182.225:38606');
*/

let lotunClient: LotunClient;
// const appPrivate = require('./app-private');

const createSocketConnection = () => {
  const ws = new WebSocket(`${lotunClient.connectUrl}`, {
    headers: {
      authorization: lotunClient.deviceToken || '',
      'x-ws-stream-version': WebsocketStreamVersion,
      'x-lotun-client-version': clientVersion,
    },
  });
  // @TODO auto detect client / server
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

  // let interval = null;
  const wsOnOpen = async () => {
    // console.log('open');
    /*
    ws.isAlive = true;
    interval = setInterval(() => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
      return null;
    }, 30000);
    */

    wsStream.send({
      type: 'clientInfo',
      data: {
        systemInfo: await getSystemInfo(),
      },
    });
  };

  const wsReconnectOnClose = (code: any, reason: any) => {
    lotunClient.emit('close', code, reason);

    setTimeout(() => {
      createSocketConnection();
    }, 5000);
    //clearInterval(interval);
  };

  const wsOnError = () => {
    // lotunClient.emit('error', err);
    ws.terminate();
  };

  const wsOnPong = () => {
    //ws.isAlive = true;
  };

  ws.on('open', wsOnOpen);
  ws.on('pong', wsOnPong);
  ws.on('error', wsOnError);

  ws.once('close', async (code, reason) => {
    if (code === 1006) {
      try {
        // @ts-ignore
        reason = ws._req.res.headers['x-lotun-close-reason'];
      } catch {}
    }

    if (!reason) {
      reason = <ClientError>'CONNECTION_ERROR';
    }

    ws.removeListener('open', wsOnOpen);
    ws.removeListener('pong', wsOnPong);
    ws.removeListener('error', wsOnError);

    wsReconnectOnClose(code, reason);
  });
};

export function createConnection(lc: LotunClient) {
  lotunClient = lc;
  createSocketConnection();
}
