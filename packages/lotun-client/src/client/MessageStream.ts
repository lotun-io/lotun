import { Duplex } from 'stream';
import { EventEmitter } from 'events';
import { StringDecoder } from 'string_decoder';
import { LotunMessageType } from './LotunSocket';

export interface MessageStream {
  on(
    event: 'message',
    listener: (type: string, payload: unknown) => void,
  ): this;
  on(event: 'error', listener: (err: Error) => void): this;
}

export class MessageStream extends EventEmitter {
  private jsonStream: JsonStream;
  constructor(duplex: Duplex) {
    super();
    this.jsonStream = new JsonStream(duplex);

    this.jsonStream.on('message', chunk => {
      this.emit('message', chunk.event, chunk.args);
    });

    this.jsonStream.on('error', (err: Error) => {
      this.emit('error', err);
    });
  }

  send<T extends keyof LotunMessageType>(
    event: T,
    args: LotunMessageType[T],
  ): boolean {
    const data = {
      event,
      args,
    };

    this.jsonStream.send(data);
    return true;
  }

  destroy() {
    this.jsonStream.destroy();
    this.removeAllListeners();
  }
}

class JsonStream extends EventEmitter {
  private duplex: Duplex;
  private message: string;

  constructor(duplex: Duplex) {
    super();
    this.duplex = duplex;
    this.message = '';

    const decoder = new StringDecoder();

    duplex.on('data', async chunk => {
      this.message += decoder.write(chunk);

      this._parse();
    });

    duplex.once('end', async () => {
      this.message += decoder.end();
      this._parse();
    });
  }

  get isDead() {
    return !this.duplex.writable;
  }

  _parse() {
    while (true) {
      const i = this.message.indexOf('\n');
      if (i === -1) {
        break;
      }

      const msg = this.message.substr(0, i);
      this.message = this.message.substr(i + 1);

      try {
        const obj = JSON.parse(msg);
        this.emit('message', obj);
      } catch (error) {
        error.text = msg;
        this.emit('error', error);
      }
    }
  }

  send(data: any) {
    if (this.isDead) {
      return false;
    }

    this.duplex.write(JSON.stringify(data) + '\n');
    return true;
  }

  close() {
    if (this.isDead) {
      return false;
    }

    this.duplex.end();
    return true;
  }

  destroy() {
    this.duplex.destroy();
    this.removeAllListeners();
  }
}
