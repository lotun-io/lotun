/* eslint-disable no-console */
const net = require('net');
const tls = require('tls');
const WebSocket = require('ws');

const clientVersion = require('../package.json').version;

// const WebsocketStream = require(process.cwd() + '/../lotun-be/lib/core/server/common/WebsocketStream.js');
const WebsocketStream = require('./WebsocketStream.js');

/*
const HttpsProxyAgent = require('https-proxy-agent');
const usProxyAgent = new HttpsProxyAgent('http://12.131.182.225:38606');
*/

let lotunClient = null;
// const appPrivate = require('./app-private');

const createSocketConnection = () => {
  const ws = new WebSocket(`${lotunClient.connectUrl}`, {
    headers: {
      authorization: lotunClient.deviceToken,
    },
    // agent: usProxyAgent,
  });

  const wsStream = new WebsocketStream(ws, 'client');

  wsStream.on('stream', options => {
    console.log('stream');
    const { stream, header } = options;
    const forward = header;

    console.log('forward', forward);

    if (forward.protocol === 'TCP') {
      let socket = null;

      if (!forward.useTLS) {
        socket = net.connect(forward.socketOptions);
      } else {
        socket = tls.connect({
          ...forward.socketOptions,
          ...forward.tlsOptions,
        });
      }

      const socketOnError = err => {
        console.log('socket.error');
        stream.sendError(err);
        stream.destroy();
        socket.destroy();
      };

      socket.on('error', socketOnError);
      socket.once('close', () => {
        console.log('close');
        socket.removeListener('error', socketOnError);
      });

      socket.pipe(stream).pipe(socket);
    }
  });

  wsStream.on('message', message => {
    if (message.type === 'connect') {
      lotunClient.emit('connect');
    }

    /*
    if (message.type === 'getSystemInfo') {
      const sysInfo = await systemInfo();
      ws.send(
        JSON.stringify({
          type: 'SystemInfo',
          data: sysInfo,
        }),
      );
    }
    */
  });

  let interval = null;
  const wsOnOpen = () => {
    console.log('open');
    ws.isAlive = true;
    interval = setInterval(() => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
      return null;
    }, 30000);

    wsStream.send({
      type: 'clientInfo',
      data: {
        version: clientVersion,
        osInfo: {
          test: 'test',
        },
      },
    });
  };

  let reconnectHappend = false;
  const wsReconnectOnClose = (code, reason) => {
    if (!reconnectHappend) {
      lotunClient.emit('close', code, reason);
      setTimeout(() => {
        createSocketConnection();
      }, 5000);
      clearInterval(interval);
    }
    reconnectHappend = true;
  };

  const wsOnError = () => {
    // lotunClient.emit('error', err);
    ws.terminate();
  };

  const wsOnPong = () => {
    ws.isAlive = true;
  };

  const wsOnUnexpectedResponse = (req, res) => {
    let reason = '';
    const resOnData = data => {
      reason += data;
    };
    res.on('data', resOnData);
    res.once('end', () => {
      res.removeListener('data', resOnData);
      req.abort();
      wsReconnectOnClose(res.statusCode, reason);
      ws.terminate();
    });
  };

  ws.on('open', wsOnOpen);
  ws.on('pong', wsOnPong);
  ws.on('error', wsOnError);
  ws.on('unexpected-response', wsOnUnexpectedResponse);

  ws.once('close', (code, reason) => {
    console.log('ws.close', code, reason);
    ws.removeListener('open', wsOnOpen);
    ws.removeListener('pong', wsOnPong);
    ws.removeListener('error', wsOnError);
    ws.removeListener('unexpected-response', wsOnUnexpectedResponse);

    wsReconnectOnClose(code, reason);
  });
};

module.exports = {
  createConnection(lc) {
    lotunClient = lc;
    createSocketConnection();
  },
};
