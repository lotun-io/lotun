import { Duplex, DuplexOptions } from "stream";
import { uuidToBuffer, uuidToString } from "./uuid-buffer";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

enum HeaderTypeEnum {
  DUPLEX_DATA,
  DUPLEX_CREATE,
  DUPLEX_CLOSE,
  DUPLEX_END,
  DUPLEX_FINISH,
  DUPLEX_WRITE_MORE,
  EMIT_DUPLEX_CREATE,
  SET_ID,
}

const MAX_PAYLOAD_LENGTH = 65536;
const MAX_BUFFER_SIZE = MAX_PAYLOAD_LENGTH * 15;

class LotunDuplexHandler {
  idBuffer: Buffer;
  duplex: LotunDuplex;
  writeCbSet = new Set<{ cb: () => void; length: number }>();
  writeRequested = MAX_BUFFER_SIZE;
  readRequested = 0;

  constructor(
    public lotunMux: LotunMux,
    public id: string,
    opts?: DuplexOptions
  ) {
    this.idBuffer = uuidToBuffer(id);
    this.duplex = new LotunDuplex(this, opts);
  }

  continue() {
    while (this.writeCbSet.size > 0) {
      const { value } = this.writeCbSet.values().next();
      const { cb, length } = value;
      const newWriteRequested = this.writeRequested - length;
      if (newWriteRequested > 0 || length > MAX_BUFFER_SIZE) {
        this.writeCbSet.delete(value);
        this.writeRequested = newWriteRequested;
        cb();
      } else {
        break;
      }
    }
  }

  remoteEnd() {
    if (this.duplex.readable) {
      this.duplex.push(null);
    }
  }

  remoteWrite(chunk: Buffer) {
    if (this.duplex.readable) {
      const bufferSize = this.duplex.readableLength;
      this.duplex.push(chunk);
      const diff = this.duplex.readableLength - bufferSize;
      if (diff === 0) {
        this.readRequested += chunk.length;
      }
    }
  }

  remoteWriteMore() {
    this.writeRequested += MAX_PAYLOAD_LENGTH;
    this.continue();
  }
}

export class LotunDuplex extends Duplex {
  constructor(private _handler: LotunDuplexHandler, opts?: DuplexOptions) {
    super(opts);
    const read = this.read.bind(this);

    this.read = function (...args) {
      /*
      if (this.readableLength > MAX_BUFFER_SIZE) {
        console.log(this.readableLength, MAX_BUFFER_SIZE);
      }
      */

      const readRes = read(...args) as Buffer | null;

      if (readRes) {
        this._handler.readRequested += readRes.length;
      }

      while (this._handler.readRequested > MAX_PAYLOAD_LENGTH) {
        this._handler.readRequested -= MAX_PAYLOAD_LENGTH;

        this._handler.lotunMux.sendTo(
          this._handler.idBuffer,
          HeaderTypeEnum.DUPLEX_WRITE_MORE,
          undefined,
          true
        );
      }

      return readRes;
    };

    this.on("finish", () => {
      this._handler.lotunMux.sendTo(
        this._handler.idBuffer,
        HeaderTypeEnum.DUPLEX_FINISH
      );
      this.destroy();
    });

    this.on("close", () => {
      this._handler.lotunMux.sendTo(
        this._handler.idBuffer,
        HeaderTypeEnum.DUPLEX_CLOSE
      );
      this.destroy();
    });

    this.on("end", () => {
      this._handler.lotunMux.sendTo(
        this._handler.idBuffer,
        HeaderTypeEnum.DUPLEX_END
      );
      this.destroy();
    });
  }

  _read() {}

  _write(chunk: Buffer, encoding: string, callback: () => any) {
    const write = () => {
      this._handler.lotunMux.sendTo(
        this._handler.idBuffer,
        HeaderTypeEnum.DUPLEX_DATA,
        chunk,
        undefined,
        callback
      );
    };

    this._handler.writeCbSet.add({ cb: write, length: chunk.length });
    this._handler.continue();
  }
}

export interface LotunMux {
  on(event: "duplex", listener: (duplex: Duplex, meta: unknown) => void): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  emit(event: "duplex", duplex: Duplex, meta: unknown): boolean;
  emit(event: string | symbol, ...args: any[]): boolean;
}

export class LotunMux extends EventEmitter {
  private _id: string = "";
  private _carrierPause: boolean = false;
  private _duplexHandlerMap = new Map<string, LotunDuplexHandler>();
  private _process: boolean = false;
  private _state: "TYPE" | "PAYLOAD_LENGTH" | "PAYLOAD" = "TYPE";
  private _payloadLength: number = 0;
  private _type: number = 0;
  private _hasPayload: boolean = false;
  private _bufferedBytes: number = 0;
  private _carrierDrainCbSet = new Set<() => void>();
  private _carrierDrainCbPrioritySet = new Set<() => void>();
  private _processCarrierDrainCbInProgress = false;
  private _queue = new Set<{ buffer: Buffer }>();
  private _emptyBuffer = Buffer.from("");

  constructor(private _carrier: Duplex) {
    super();

    this._carrier.on("error", (err) => {
      for (const handler of this._duplexHandlerMap.values()) {
        handler.duplex.emit("error", err);
      }

      this._carrier.destroy();
    });

    this._carrier.on("close", () => {
      for (const [key, handler] of this._duplexHandlerMap.entries()) {
        this._duplexHandlerMap.delete(key);
        handler.duplex.destroy();
      }
    });

    this._carrier.on("drain", () => {
      this._carrierPause = false;
      if (this._processCarrierDrainCbInProgress === false) {
        this._processCarrierDrainCb();
      }
    });

    this._carrier.on("data", (chunk) => {
      this._bufferedBytes += chunk.length;
      this._queue.add({ buffer: chunk });

      this._process = true;
      this._onData();
    });

    this.on("ping", () => {
      this.sendEmit("pong");
    });
  }

  private _onData() {
    while (this._process) {
      switch (this._state) {
        case "TYPE":
          this._getType();
          break;
        case "PAYLOAD_LENGTH":
          this._getPayloadLength();
          break;
        case "PAYLOAD":
          this._getPayload();
          break;
        default:
          throw new Error("Should not happen");
      }
    }
  }

  private _hasEnough(size: number) {
    if (this._bufferedBytes >= size) {
      return true;
    }
    this._process = false;
    return false;
  }

  private _readBytes(size: number): Buffer[] {
    if (size === 0) {
      return [this._emptyBuffer];
    }

    let result: Buffer[] = [];
    this._bufferedBytes -= size;

    let bufferHandle: { buffer: Buffer } = this._queue.values().next().value;

    if (size === bufferHandle.buffer.length) {
      this._queue.delete(bufferHandle);
      result.push(bufferHandle.buffer);
      return result;
    }

    if (size < bufferHandle.buffer.length) {
      result.push(bufferHandle.buffer.subarray(0, size));
      bufferHandle.buffer = bufferHandle.buffer.subarray(size);
      return result;
    }

    let length;

    while (size > 0) {
      length = bufferHandle.buffer.length;

      if (size >= length) {
        result.push(bufferHandle.buffer.subarray());
        this._queue.delete(bufferHandle);
        bufferHandle = this._queue.values().next().value;
      } else {
        result.push(bufferHandle.buffer.subarray(0, size));
        bufferHandle.buffer = bufferHandle.buffer.subarray(size);
      }

      size -= length;
    }

    return result;
  }

  private _concatToString(payload: Buffer[]) {
    let result = "";
    payload.map((buffer) => {
      result += buffer.toString();
    });
    return result;
  }

  private _concat(payload: Buffer[]) {
    if (payload.length === 1) {
      return payload[0];
    }
    return Buffer.concat(payload);
  }

  private _getType() {
    if (this._hasEnough(1)) {
      this._hasPayload = false;
      this._type = this._concat(this._readBytes(1)).readUInt8(0);
      if (this._type > 127) {
        this._type -= 128;
        this._hasPayload = true;
      }
      this._state = "PAYLOAD_LENGTH";
    }
  }

  private _getPayloadLength() {
    if (!this._hasPayload) {
      this._state = "PAYLOAD";
      return;
    }

    if (this._hasEnough(2)) {
      this._payloadLength =
        this._concat(this._readBytes(2)).readUInt16BE(0) + 1;

      this._state = "PAYLOAD";
    }
  }

  private _getPayload() {
    if (!this._hasPayload) {
      this._state = "TYPE";
      this._processPacket(this._type, [this._emptyBuffer]);
      return;
    }

    if (this._hasEnough(this._payloadLength)) {
      let payload = this._readBytes(this._payloadLength);
      this._state = "TYPE";
      this._processPacket(this._type, payload);
    }
  }

  private _processPacket(type: HeaderTypeEnum, payload: Buffer[]) {
    switch (type) {
      case HeaderTypeEnum.SET_ID: {
        this._id = uuidToString(this._concat(payload));
        break;
      }
      case HeaderTypeEnum.DUPLEX_CREATE: {
        const { meta } = JSON.parse(this._concatToString(payload));
        const handler = this._createDuplex(this._id);
        this.emit("duplex", handler.duplex, meta);
        break;
      }
      case HeaderTypeEnum.EMIT_DUPLEX_CREATE: {
        const { name } = JSON.parse(this._concatToString(payload)) as {
          name: string;
        };
        const { duplex } = this._createDuplex(this._id);
        let dataString = "";
        duplex.on("data", (chunk: Buffer) => {
          dataString += chunk.toString();
        });
        duplex.once("end", () => {
          let data: unknown | undefined;
          if (dataString.length > 0) {
            data = JSON.parse(dataString);
          }
          this.emit(name, data);
          duplex.destroy();
        });
        break;
      }
      case HeaderTypeEnum.DUPLEX_DATA: {
        payload.map((chunk) => this._duplexRemoteWrite(chunk));
        break;
      }
      case HeaderTypeEnum.DUPLEX_END: {
        this._duplexRemoteEnd();
        break;
      }
      case HeaderTypeEnum.DUPLEX_FINISH: {
        this._duplexRemoteEnd();
        break;
      }
      case HeaderTypeEnum.DUPLEX_CLOSE: {
        this._duplexRemoteEnd();
        break;
      }
      case HeaderTypeEnum.DUPLEX_WRITE_MORE: {
        const handler = this._duplexHandlerMap.get(this._id);
        if (handler) {
          handler.remoteWriteMore();
        }
        break;
      }
      default: {
        break;
      }
    }
  }

  private _duplexRemoteEnd() {
    const handler = this._duplexHandlerMap.get(this._id);
    if (handler) {
      handler.remoteEnd();
    }
  }

  private _duplexRemoteWrite(payload: Buffer) {
    const handler = this._duplexHandlerMap.get(this._id);
    if (handler) {
      handler.remoteWrite(payload);
    }
  }

  private _createMessage(
    chunks: Buffer[],
    type: HeaderTypeEnum,
    payload?: string | Buffer | Uint8Array
  ) {
    if (!this._carrier.writable) {
      return;
    }

    if (!payload) {
      payload = this._emptyBuffer;
    }
    let messageBuffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(payload);

    if (messageBuffer.length > MAX_PAYLOAD_LENGTH) {
      throw new Error("Should not happen");
    }

    let length = messageBuffer.length;
    let hasPayload = false;

    if (messageBuffer.length > 0) {
      length--;
      type += 128;
      hasPayload = true;
    }

    let typeBuffer = Buffer.allocUnsafe(1);
    typeBuffer.writeUInt8(type, 0);

    chunks.push(typeBuffer);

    if (hasPayload) {
      let lengthBuffer = Buffer.allocUnsafe(2);
      lengthBuffer.writeUInt16BE(length, 0);
      chunks.push(lengthBuffer);
      chunks.push(messageBuffer);
    }
  }

  private _write(chunks: Buffer[], priority?: boolean, callback?: () => void) {
    this._addCarrierDrainCb(() => {
      for (let i = 0; i < chunks.length; i++) {
        if (this._carrier.writable) {
          this._carrierPause = !this._carrier.write(chunks[i]);
        }
      }
      if (callback) {
        callback();
      }
    }, priority);
  }

  private _createDuplex(id: string) {
    const handler = new LotunDuplexHandler(this, id, {
      allowHalfOpen: false,
    });
    const duplex = handler.duplex;
    duplex.on("close", () => {
      this._duplexHandlerMap.delete(id);
    });

    this._duplexHandlerMap.set(id, handler);
    return handler;
  }

  private _createEmitDuplex(meta: { name: string }) {
    const id = uuidv4();
    const payload = meta;
    const handler = this._createDuplex(id);
    this.sendTo(
      handler.idBuffer,
      HeaderTypeEnum.EMIT_DUPLEX_CREATE,
      JSON.stringify(payload)
    );

    return handler;
  }

  private _addCarrierDrainCb(callback: () => void, priority?: boolean) {
    if (priority) {
      this._carrierDrainCbPrioritySet.add(callback);
    } else {
      this._carrierDrainCbSet.add(callback);
    }

    if (
      this._carrierPause === false &&
      this._processCarrierDrainCbInProgress === false
    ) {
      this._processCarrierDrainCb();
    }
  }

  private _processCarrierDrainCb() {
    this._processCarrierDrainCbInProgress = true;

    while (
      this._carrierDrainCbSet.size > 0 ||
      this._carrierDrainCbPrioritySet.size > 0
    ) {
      if (this._carrierDrainCbPrioritySet.size > 0) {
        const { value: cb } = this._carrierDrainCbPrioritySet.values().next();
        this._carrierDrainCbPrioritySet.delete(cb);
        cb();
        continue;
      }

      if (this._carrierDrainCbSet.size > 0) {
        const { value: cb } = this._carrierDrainCbSet.values().next();
        this._carrierDrainCbSet.delete(cb);
        cb();
      }
    }

    this._processCarrierDrainCbInProgress = false;
  }

  ping() {
    this.sendEmit("ping");
  }

  sendEmit(name: string, payload?: unknown) {
    let data: string | undefined;
    if (payload) {
      data = JSON.stringify(payload);
    }
    const { duplex } = this._createEmitDuplex({ name });
    if (data) {
      duplex.write(data);
    }
    duplex.end();

    return duplex;
  }

  sendTo(
    id: Buffer,
    type: HeaderTypeEnum,
    payload?: string | Buffer | Uint8Array,
    priority?: boolean,
    callback?: () => void
  ) {
    if (!payload) {
      payload = this._emptyBuffer;
    }
    if (type === HeaderTypeEnum.DUPLEX_DATA) {
      let chunk = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
      let begin = 0;
      while (begin <= chunk.length) {
        const part = chunk.subarray(begin, begin + MAX_PAYLOAD_LENGTH);
        begin += MAX_PAYLOAD_LENGTH;
        const chunks: Buffer[] = [];
        this._createMessage(chunks, HeaderTypeEnum.SET_ID, id);
        this._createMessage(chunks, type, part);
        this._write(chunks, priority);
      }
    } else {
      const chunks: Buffer[] = [];
      this._createMessage(chunks, HeaderTypeEnum.SET_ID, id);
      this._createMessage(chunks, type, payload);
      this._write(chunks, priority);
    }

    if (callback) {
      this._write([], priority, callback);
    }
  }

  createDuplex(meta?: any) {
    const id = uuidv4();
    const payload = {
      meta,
    };
    const handler = this._createDuplex(id);
    this.sendTo(
      handler.idBuffer,
      HeaderTypeEnum.DUPLEX_CREATE,
      JSON.stringify(payload),
      true
    );

    return handler.duplex;
  }

  destroy() {
    this._carrier.destroy();
  }
}
