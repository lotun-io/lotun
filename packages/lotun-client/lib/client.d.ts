/// <reference types="node" />
import EventEmitter from 'events';
export { ClientError as LotunClientError } from './wsStream/WsStream';
declare type StageType = 'devel' | 'stage';
export declare class LotunClient extends EventEmitter {
    connectUrl: string;
    connectUrlApi: string;
    dashboardUrl: string;
    deviceToken: string | undefined;
    constructor(stage?: StageType);
    generateDeviceToken(): Promise<any>;
    connect(): void;
    setDeviceToken(deviceToken: string): void;
}
