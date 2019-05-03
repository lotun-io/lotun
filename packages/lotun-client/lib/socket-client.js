"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const tls_1 = __importDefault(require("tls"));
const ws_1 = __importDefault(require("ws"));
const system_info_1 = require("./system-info");
const clientVersion = require('../package.json').version;
// const WebsocketStream = require(process.cwd() + '/../lotun-be/lib/core/server/common/WebsocketStream.js');
const WsStream_1 = require("./wsStream/WsStream");
const WebsocketStreamVersion = require(`${__dirname}/wsStream/WsStream`).version;
/*
const HttpsProxyAgent = require('https-proxy-agent');
const usProxyAgent = new HttpsProxyAgent('http://12.131.182.225:38606');
*/
let lotunClient;
// const appPrivate = require('./app-private');
const createSocketConnection = () => {
    const ws = new ws_1.default(`${lotunClient.connectUrl}`, {
        headers: {
            authorization: lotunClient.deviceToken || '',
            'x-ws-stream-version': WebsocketStreamVersion,
            'x-lotun-client-version': clientVersion,
        },
    });
    // @TODO auto detect client / server
    const wsStream = new WsStream_1.WebsocketStream(ws);
    wsStream.on('stream', (options) => {
        // console.log('stream');
        const { stream, header } = options;
        const forward = header;
        // console.log('forward', forward);
        let socket;
        if (forward.type === 'TCP') {
            socket = net_1.default.connect(forward.socketOptions);
        }
        else if (forward.type === 'TLS') {
            socket = tls_1.default.connect({
                ...forward.socketOptions,
                ...forward.tlsOptions,
            });
        }
        else {
            // not supported
            stream.destroy();
            return;
        }
        const socketOnError = (err) => {
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
    wsStream.on('message', (message) => {
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
                systemInfo: await system_info_1.getSystemInfo(),
            },
        });
    };
    const wsReconnectOnClose = (code, reason) => {
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
            }
            catch (_a) { }
        }
        if (!reason) {
            reason = 'CONNECTION_ERROR';
        }
        ws.removeListener('open', wsOnOpen);
        ws.removeListener('pong', wsOnPong);
        ws.removeListener('error', wsOnError);
        wsReconnectOnClose(code, reason);
    });
};
function createConnection(lc) {
    lotunClient = lc;
    createSocketConnection();
}
exports.createConnection = createConnection;
//# sourceMappingURL=socket-client.js.map