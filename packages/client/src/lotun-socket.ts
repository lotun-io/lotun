import net from "net";
import { Duplex } from "stream";
import { EventEmitter } from "events";
import { LotunMux } from "./lotun-mux";

export type LotunCloseReason =
  | "INVALID_DEVICE_TOKEN"
  | "UNPAIRED_DEVICE_TOKEN"
  | "LOCKED_ACCOUNT"
  | "QUOTA_LIMIT"
  | "NETWORK_ERROR"
  | "INVALID_TARGET"
  | "UNKNOWN_ERROR";

export type EntryAppType = {
  hash: string;
  id: string;
  name: string;
  entryPoint: {
    type: "DEVICE_PORT";
    portType: "TCP" | "UDP";
    port: string;
    updatedAt: string;
    createdAt: string;
  };
  updatedAt: string;
  createdAt: string;
};

export type ForwardAppType = {
  hash: string;
  id: string;
  name: string;
  entryPoint: {
    type: "HOSTNAME" | "EXTERNAL_PORT" | "DEVICE_PORT";
    portType: "TCP" | "UDP";
    port: string;
    hostname: string;
    path: string;
    updatedAt: string;
    createdAt: string;
  };
  middlewares: {
    http?: {
      proxy?: {
        target?: string;
      };
    };
    tcp?: {
      proxy?: {
        target: string;
      };
    };
  };
  updatedAt: string;
  createdAt: string;
};

export type LotunMessageApps = {
  forward: ForwardAppType[];
  entry: EntryAppType[];
};

export type LotunMessageUpdateHealthCheck = {
  appId: string;
  status: "HEALTHY" | "UNHEALTHY";
};

export type LotunMessageDeviceClientInfo = {
  id?: string;
  name?: string;
  deviceToken?: string;
  mode: "NO_DEVICE_TOKEN" | "DEVICE_TOKEN";
  appConfig?: {
    type: "HTTP" | "TCP";
    target: string;
  };
  version: string;
  os: any;
};

export type LotunMessageConnect = {
  id: string;
  options: {
    workersLimit: number | undefined;
  };
  app?: {
    entry: string;
    target: string;
    closeAt: string;
  };
};

export type LotunMessageType = {
  deviceClientInfo: LotunMessageDeviceClientInfo;
  connect: LotunMessageConnect;
  close: {
    reason: LotunCloseReason;
  };
  apps: LotunMessageApps;
  updateHealthCheck: LotunMessageUpdateHealthCheck;
};

export interface LotunSocketEvents {
  duplex: (duplex: Duplex, meta: unknown) => void;
  connect: (connect: LotunMessageType["connect"]) => void;
  apps: (apps: LotunMessageType["apps"]) => void;
  close: (close: LotunMessageType["close"]) => void;
  ping: () => void;
}

export interface LotunSocket {
  on<U extends keyof LotunSocketEvents>(
    event: U,
    listener: LotunSocketEvents[U]
  ): this;

  once<U extends keyof LotunSocketEvents>(
    event: U,
    listener: LotunSocketEvents[U]
  ): this;

  emit<U extends keyof LotunSocketEvents>(
    event: U,
    ...args: Parameters<LotunSocketEvents[U]>
  ): boolean;
}

export class LotunSocket extends EventEmitter {
  mux: LotunMux;

  constructor(public carrier: net.Socket) {
    super();

    this.carrier = carrier;

    this.mux = new LotunMux(this.carrier);

    this.mux.on("close", (payload) => {
      this.emit("close", payload);
    });

    this.mux.on("duplex", (duplex, meta) => {
      this.emit("duplex", duplex, meta);
    });

    this.mux.on("connect", (payload) => {
      this.emit("connect", payload);
    });

    this.mux.on("apps", (payload) => {
      this.emit("apps", payload);
    });

    this.mux.on("ping", () => {
      this.emit("ping");
      this.mux.sendEmit("pong");
    });

    this.carrier.on("finish", () => {
      this.destroy();
    });

    this.carrier.on("end", () => {
      this.destroy();
    });

    this.carrier.on("error", (err) => {
      this.destroy();
    });

    this.carrier.once("close", () => {
      this.destroy();
      this.emit("close", { reason: "NETWORK_ERROR" });
    });
  }

  createDuplex(meta: any) {
    return this.mux.createDuplex(meta);
  }

  deviceClientInfo(payload: LotunMessageType["deviceClientInfo"]) {
    this.mux.sendEmit("deviceClientInfo", payload);
  }

  updateHealthCheck(payload: LotunMessageType["updateHealthCheck"]) {
    this.mux.sendEmit("updateHealthCheck", payload);
  }

  destroy() {
    this.carrier.destroy();
  }
}
