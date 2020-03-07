declare module 'bpmux' {
  import { Duplex } from 'stream';

  export type BPMuxOptions = {
    peer_multiplex_options?: {
      max_write_size?: number;
      check_read_overflow?: boolean;
    };
    parse_handshake_data?: (data: Buffer) => any;
    coalesce_writes?: boolean;
    high_channels?: boolean;
    max_open?: number;
    max_header_size?: number;
    keep_alive?: boolean;
  };

  export type BPMuxMultiplexOptions = {
    handshake_data?: Buffer;
    max_write_size?: number;
    check_read_overflow?: boolean;
    channel?: number;
  };

  export class BPMux {
    carrier: Duplex;
    constructor(carrier: Duplex, options?: BPMuxOptions);

    multiplex(options?: BPMuxMultiplexOptions): Duplex;
    on(event: 'peer_multiplex', callback: (duplex: Duplex) => void): void;
    on(
      event: 'handshake',
      callback: (
        duplex: Duplex,
        handshake_data: unknown,
        delay_handshake?: () => any,
      ) => void,
    ): void;
    on(
      event: 'handshake_sent',
      callback: (duplex: Duplex, complete: boolean) => void,
    ): void;
    on(event: 'drain', callback: () => void): void;
    on(event: 'end', callback: () => void): void;
    on(event: 'finish', callback: () => void): void;
    on(event: 'error', callback: (err: Error) => void): void;
    on(event: 'full', callback: () => void): void;
    on(event: 'removed', callback: (duplex: Duplex) => void): void;
    on(event: 'keep_alive', callback: () => void): void;

    once: BPMux['on'];
  }
}
