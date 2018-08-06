/* eslint-disable no-console */
const net = require('net');
const WebSocket = require('ws');
const systemInfo = require('./system-info');
const WebsocketStream = require('./websocket-stream');

let lotunClient = null;

function createSocketStreamOut(message) {
  const socketStream = new WebSocket(
    `ws://${message.hostname}/wsDeviceStreamOut?deviceToken=${lotunClient.deviceToken}`,
  );
  const websocketStream = new WebsocketStream(socketStream);

  let pingInterval = null;
  let lastStreamDate = new Date();
  websocketStream.once('open', () => {
    websocketStream.on('stream', () => {
      lastStreamDate = new Date();
    });
    pingInterval = setInterval(() => {
      const timeoutDate = new Date();
      timeoutDate.setSeconds(timeoutDate.getSeconds() - 5);
      // @TODO check last stream createdAt
      if (websocketStream.stream || lastStreamDate > timeoutDate) {
        // websocketStream.socket.ping();
      }
    }, 5000);
  });

  websocketStream.once('error', () => {});

  websocketStream.once('close', () => {
    if (pingInterval) {
      clearInterval(pingInterval);
    }
  });

  // appPrivate.websocketStream = websocketStream

  websocketStream.on('stream', options => {
    // make ping ?!
    const { stream, header } = options;

    const socket = new net.Socket();
    socket.pipe(stream).pipe(socket);

    const { forward } = header.data;

    socket.connect({
      host: forward.hostname,
      port: forward.port,
    });

    /*
    stream.on('end', () => {
      console.log('stream.end')
    })

    stream.on('finish', () => {
      console.log('stream.finish')
    })

    stream.on('unpipe', () => {
      console.log('stream.unpipe')
    })

    stream.on('close', () => {
      console.log('stream.close')
    })
    */

    socket.on('error', err => {
      // console.log('socket.error');
      stream.sendError(err);
      socket.destroy();
    });

    stream.on('error', () => {
      stream.destroy();
    });
  });

  // return socketStream
}

const appPrivate = require('./app-private');

const createSocketConnection = () => {
  // console.log(`${lotunClient.connectUrl}/wsClient?deviceToken=${lotunClient.deviceToken}`)
  const socket = new WebSocket(`${lotunClient.connectUrl}/wsDeviceMaster?deviceToken=${lotunClient.deviceToken}`);
  let pingInterval = null;

  socket.on('open', async () => {
    pingInterval = setInterval(() => {
      socket.ping();
      // @TODO check timeout and close !
    }, 1000);
  });

  socket.on('pong', () => {
    // check client pongs for timeout !
    // console.log('pong !')
  });

  socket.on('message', async data => {
    const message = JSON.parse(data);
    if (message.type === 'closeReason') {
      lotunClient.emit('closeReason', message);
    }

    if (message.type === 'ready') {
      lotunClient.emit('connected');
    }

    if (message.type === 'getSystemInfo') {
      const sysInfo = await systemInfo();
      socket.send(
        JSON.stringify({
          type: 'SystemInfo',
          data: sysInfo,
        }),
      );
    }

    if (message.type === 'appsPrivate') {
      appPrivate.closeAll();
      message.data.forEach(one => {
        appPrivate.createServer(one);
      });
    }

    if (message.type === 'StreamOutCreate') {
      // console.log('StreamOutCreate');
      // console.log(message);
      createSocketStreamOut(message);
    }
  });

  socket.on('error', err => {
    lotunClient.emit('error', err);
    socket.emit('close', err);
  });

  socket.on('close', err => {
    if (pingInterval) {
      clearInterval(pingInterval);
    }
    lotunClient.emit('close', err);
    setTimeout(() => {
      createSocketConnection();
    }, 5000);
  });
};

module.exports = {
  createConnection(lc) {
    lotunClient = lc;
    createSocketConnection();
  },
};
