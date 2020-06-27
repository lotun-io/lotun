// @ts-nocheck
import { Duplex, DuplexOptions } from 'stream';

const kCallback = Symbol('Callback');
const kOtherSide = Symbol('Other');

class DuplexSocket extends Duplex {
  constructor(options?: DuplexOptions) {
    super(options);
    this[kCallback] = null;
    this[kOtherSide] = null;
  }

  _read() {
    const callback = this[kCallback];
    if (callback) {
      this[kCallback] = null;
      callback();
    }
  }

  _write(chunk, encoding, callback) {
    if (chunk.length === 0) {
      process.nextTick(callback);
    } else {
      this[kOtherSide].push(chunk);
      this[kOtherSide][kCallback] = callback;
    }
  }

  _final(callback) {
    this[kOtherSide].on('end', callback);
    this[kOtherSide].push(null);
  }
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
