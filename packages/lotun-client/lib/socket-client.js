"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const tls_1 = __importDefault(require("tls"));
const ws_1 = __importDefault(require("ws"));
const system_info_1 = require("./system-info");
const WsStream_1 = require("./wsStream/WsStream");
const WsStream_2 = require("./wsStream/WsStream");
const clientVersion = require('../package.json').version;
/*
const HttpsProxyAgent = require('https-proxy-agent');
const usProxyAgent = new HttpsProxyAgent('http://12.131.182.225:38606');
*/
// let lotunClient: LotunClient;
// const appPrivate = require('./app-private');
const createSocketConnection = (lotunClient) => {
    const ws = new ws_1.default(`${lotunClient.connectUrl}`, {
        handshakeTimeout: 10000,
        headers: {
            authorization: lotunClient.deviceToken || '',
            'x-ws-stream-version': WsStream_2.version,
            'x-lotun-client-version': clientVersion,
        },
    });
    const wsStream = new WsStream_1.WebsocketStream(ws);
    wsStream.on('stream', (options) => {
        console.log('stream', options.header);
        const { stream, header } = options;
        const forward = header;
        // console.log('forward', forward);
        let socket;
        if (forward.type === 'TCP') {
            socket = net_1.default.connect(forward.socket);
        }
        else if (forward.type === 'TLS') {
            socket = tls_1.default.connect({
                ...forward.socket,
                ...forward.tls,
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
                systemInfo: await system_info_1.getSystemInfo(),
            },
        });
    };
    const wsOnPing = async () => {
        heartbeat();
    };
    const wsReconnectOnClose = (code, reason) => {
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
            }
            catch (_a) { }
        }
        if (!reason) {
            reason = 'CONNECTION_ERROR';
        }
        wsReconnectOnClose(code, reason);
    });
};
function createConnection(lc) {
    createSocketConnection(lc);
}
exports.createConnection = createConnection;
//# sourceMappingURL=socket-client.js.map