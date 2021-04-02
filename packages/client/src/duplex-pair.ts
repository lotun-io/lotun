// @ts-nocheck
import { Duplex, DuplexOptions } from "stream";

const kCallback = Symbol("Callback");
const kOtherSide = Symbol("Other");

export class DuplexSocket extends Duplex {
  remoteAddress: string | undefined;
  remotePort: number | undefined;

  private timeoutHandle: NodeJS.Timeout | undefined;

  constructor(options?: DuplexOptions) {
    super(options);
    this[kCallback] = null;
    this[kOtherSide] = null;
  }

  _read() {
    if (this.timeoutHandle) {
      this.timeoutHandle.refresh();
    }

    const callback = this[kCallback];
    if (callback) {
      this[kCallback] = null;
      callback();
    }
  }

  _write(chunk, encoding, callback) {
    if (this.timeoutHandle) {
      this.timeoutHandle.refresh();
    }

    if (chunk.length === 0) {
      process.nextTick(callback);
    } else {
      this[kOtherSide].push(chunk);
      this[kOtherSide][kCallback] = callback;
    }
  }

  _final(callback) {
    this[kOtherSide].on("end", callback);
    this[kOtherSide].push(null);
  }

  private setTimeout(timeout: number, callback?: () => void) {
    if (this.timeoutHandle) {
      clearInterval(this.timeoutHandle);
    }

    if (timeout !== 0) {
      this.timeoutHandle = setTimeout(() => {
        if (callback) {
          callback();
        }
        this.emit("timeout");
      }, timeout);
    }
  }
  private setNoDelay() {}
  private setKeepAlive() {}
  private unref() {}
  private ref() {}
}

export class DuplexPair {
  socket1: DuplexSocket;
  socket2: DuplexSocket;
  constructor(options?: DuplexOptions) {
    this.socket1 = new DuplexSocket(options);
    this.socket2 = new DuplexSocket(options);
    this.socket1[kOtherSide] = this.socket2;
    this.socket2[kOtherSide] = this.socket1;
  }
}

export type CreateDuplexPairOptions = {
  remoteAddress?: string;
  remotePort?: number;
};

export function createDuplexPair(options: CreateDuplexPairOptions = {}) {
  const { socket1, socket2 } = new DuplexPair({
    allowHalfOpen: false,
  });

  socket1.on("close", () => {
    socket2.destroy();
  });

  socket2.on("close", () => {
    socket1.destroy();
  });

  if (options.remoteAddress) {
    socket2.remoteAddress = options.remoteAddress;
  }

  if (options.remotePort) {
    socket2.remotePort = options.remotePort;
  }

  return { socket1, socket2 };
}
