const net = require('net');
const systemInfo = require('./system-info');
const WebSocket = require('uws');

//const WebsocketStream = require('../../lotun-be/lib/core/server/websocket-stream');

const WebsocketStream = require('./websocket-stream')


function createSocketStreamOut(message) {
  const socketStream = new WebSocket(`ws://${message.hostname}/wsDeviceStreamOut?deviceToken=${lotunClient.deviceToken}`);
  const websocketStream = new WebsocketStream(socketStream);

  websocketStream.once('open', () => {
    console.log('socketStreamOut open');
  });

  websocketStream.once('error', () => {
    console.log('socketStreamOut error');
  });

  websocketStream.once('close', () => {
    console.log('socketStreamOut close');
  });

  // appPrivate.websocketStream = websocketStream

  websocketStream.on('stream', (options) => {
    // options.stream.end()
    setTimeout(() => {
      //global.gc();
    }, 500);

    // console.log('new stream')
    const { stream, header } = options;
    // console.log(header)

    const socket = new net.Socket();
    socket.pipe(stream).pipe(socket);

    const { forward } = header.data;

    socket.connect({
      host: forward.hostname,
      port: forward.port,
    });

    socket.on('error', (err) => {
      console.log('socket.error');
      stream.sendError(err);
    });

    stream.on('error', (err) => {
      console.log('stream.error');
      stream.removeAllListeners();
      socket.removeAllListeners();
      socket.destroy();
      stream.destroy();
      //global.gc();
    });

    stream.on('close', () => {
      console.log('stream.close');
    });

    socket.on('socket.close', () => {
      console.log('socket.close')
    });

    socket.on('unpipe', () => {
      console.log('socket.unpipe');
    });

    socket.on('end', () => {
      console.log('socket.end');
      stream.removeAllListeners();
      socket.removeAllListeners();
      socket.destroy();
      stream.destroy();
      //global.gc();
    });

    socket.on('finish', () => {
      console.log('socket.finish');
    });

    stream.on('unpipe', () => {
      console.log('stream.unpipe');
    });

    stream.on('end', () => {
      console.log('stream.end');
      // stream.removeAllListeners()
      // socket.removeAllListeners()
      // socket.end()
      // socket.end()
      // socket.destroy()
    });

    stream.on('finish', () => {
      console.log('stream.finish');
    });
  });

  // return socketStream
};

const appPrivate = require('./appPrivate');

const createSocketConnection = function () {
  // console.log(`${lotunClient.connectUrl}/wsClient?deviceToken=${lotunClient.deviceToken}`)
  const socket = new WebSocket(`${lotunClient.connectUrl}/wsDeviceMaster?deviceToken=${lotunClient.deviceToken}`);
  let pingInterval = null

  socket.on('open', async () => {
    console.log('open');
    pingInterval = setInterval(() => {
      socket.ping();
      //@TODO check timeout and close !
    }, 1000);
  });

  socket.on('pong', () => {
    // check client pongs for timeout !
    //console.log('pong !')
  })

  socket.on('message', async (data) => {
    const message = JSON.parse(data);
    if (message.type === 'closeReason') {
      lotunClient.emit('closeReason', message);
    }

    if (message.type === 'ready') {
      lotunClient.emit('ready');
    }

    if (message.type === 'getSystemInfo') {
      const sysInfo = await systemInfo();
      socket.send(JSON.stringify({
        type: 'SystemInfo',
        data: sysInfo,
      }));
    }

    if (message.type === 'appsPrivate') {
      appPrivate.closeAll();
      message.data.forEach((one) => {
        appPrivate.createServer(one);
      });
    }

    if (message.type === 'StreamOutCreate') {
      console.log('StreamOutCreate');
      console.log(message);
      createSocketStreamOut(message);
    }
  });

  socket.on('error', (err) => {
    console.log('error', err);
    lotunClient.emit('error', err);
    socket.emit('close', err);
  });

  socket.on('close', (err) => {
    if (pingInterval) {
      clearInterval(pingInterval)
    }

    console.log('close', err);
    lotunClient.emit('close', err);
    setTimeout(() => {
      createSocketConnection();
    }, 5000);
  });
};

let lotunClient = null;
module.exports = {
  createConnection(lc) {
    lotunClient = lc;
    createSocketConnection();
  },
};
