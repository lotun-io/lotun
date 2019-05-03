/// <reference types="node" />
import { Duplex } from 'stream';
import EventEmitter from 'events';
import WebSocket from 'ws';
export declare const version = "1.0.0";
export declare type ClientError = 'CLIENT_INFO_INVALID' | 'DEVICE_TOKEN_INVALID' | 'DEVICE_TOKEN_UNPAIRED' | 'INTERNAL_SERVER_ERROR' | 'CONNECTION_ERROR';
export interface WsStreamDuplex extends Duplex {
    ___destroyCalled: boolean;
    ___cleanUpCalled: boolean;
    ___endCalled: boolean;
    ___finishCalled: boolean;
    ___writePauseSent: boolean;
    ___writePause: boolean;
    ___writeResumeSent: boolean;
    websocketStream: WebsocketStream | undefined;
    streamId: string;
    _cb: Function | undefined;
}
export declare class DuplexStream extends Duplex implements WsStreamDuplex {
    ___destroyCalled: boolean;
    ___cleanUpCalled: boolean;
    ___endCalled: boolean;
    ___finishCalled: boolean;
    ___writePauseSent: boolean;
    ___writePause: boolean;
    ___writeResumeSent: boolean;
    websocketStream: WebsocketStream | undefined;
    streamId: string;
    _cb: Function | undefined;
    constructor(options: any);
    destroy(): void;
    _cleanUp(): void;
    _writeResumed(): void;
    _handleShouldPushMore(shouldPushMore: boolean): void;
    _write(chunk: any, _: any, callback: Function): void;
    _canWrite(): boolean | undefined;
    _read(): void;
    _final(callback: Function): void;
    sendError(err: any): void;
}
export declare class WebsocketStream extends EventEmitter {
    ws: WebSocket | undefined;
    type: string;
    lastStreamId: number;
    streams: Map<any, any>;
    wsOnError: (...args: any[]) => void;
    wsOnClose: (...args: any[]) => void;
    wsOnMessage: (...args: any[]) => void;
    constructor(ws: WebSocket);
    _getStream(streamId: string): any;
    _deleteStream(streamId: string): void;
    _createStream(streamId: string): DuplexStream;
    _generateStreamId(): string;
    createStream(data: any): DuplexStream;
    send(data: any): void;
    static decodeMessage(message: any): {
        header: any;
        buffer: any;
    };
    static encodeMessage(headerObject: any, buffer?: Buffer): Buffer;
}
