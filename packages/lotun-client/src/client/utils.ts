import Debug from 'debug';
import path from 'path';
import os from 'os';
import net, { isIP } from 'net';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent, AgentOptions as HttpsAgentOptions } from 'https';
import Mitm from 'mitm';

export const debug = Debug('@lotun/client');

const mitm = Mitm();
mitm.disable();

export type CreateHttpAgentOptions = HttpsAgentOptions;
export function createHttpAgent(
  target: string,
  options: CreateHttpAgentOptions,
) {
  if (target.startsWith('http')) {
    return new HttpAgent(options);
  }

  if (target.startsWith('https')) {
    return new HttpsAgent(options);
  }

  throw new Error('Unknown target protocol');
}

export function getDefaultConfigPath() {
  return path.join(os.homedir(), '.lotun', 'config.json');
}

type CreateSocketPairOptions = net.SocketConnectOpts & {
  remoteAddress?: string;
  remotePort?: string;
};
type CreateSocketPairCallback = (remoteSockt: net.Socket) => void;

export function createSocketPair(
  netOptions: CreateSocketPairOptions,
  callback: CreateSocketPairCallback,
) {
  try {
    // @ts-ignore
    mitm.enable();
    const connectionListener = function(socketRemote: net.Socket) {
      mitm.disable();
      // @ts-ignore
      mitm.removeListener('connection', connectionListener);

      Object.defineProperty(socketRemote, 'remoteAddress', {
        get: function() {
          return netOptions.remoteAddress;
        },
        set: function() {},
      });

      Object.defineProperty(socketRemote, 'remotePort', {
        get: function() {
          return netOptions.remotePort;
        },
        set: function() {},
      });

      let remoteFamily: string | undefined = undefined;
      if (netOptions.remoteAddress) {
        const ipVersion = isIP(netOptions.remoteAddress);
        if (ipVersion) {
          remoteFamily = `IPv${ipVersion}`;
        }
      }

      Object.defineProperty(socketRemote, 'remoteFamily', {
        get: function() {
          return remoteFamily;
        },
        set: function() {},
      });

      callback(socketRemote);
    };

    mitm.on('connection', connectionListener);

    const socket = net.connect(netOptions);

    return socket;
  } catch (err) {
    mitm.disable();
    // @ts-ignore
    mitm.removeListener('connection', connectionListener);
    throw err;
  }
}
