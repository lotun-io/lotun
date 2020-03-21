import { debug as debugRoot } from './utils';
import { LotunSocket, LotunMessageApps, LotunMessageApp } from './LotunSocket';
import { EntryPoint } from './EntryPoint';
import { ForwardPoint } from './ForwardPoint';
import { Duplex } from 'stream';

const debug = debugRoot.extend('LotunApps');

export class LotunApps {
  private lotunSocket: LotunSocket;
  private configDir: string;
  private queue: Queue;
  private entryPointsMap: Map<string, EntryPoint>;
  private forwardPointsMap: Map<string, ForwardPoint>;

  constructor(options: { lotunSocket: LotunSocket; configDir: string }) {
    this.lotunSocket = options.lotunSocket;
    this.configDir = options.configDir;

    this.queue = new Queue();

    this.entryPointsMap = new Map();
    this.forwardPointsMap = new Map();
  }

  messageApps(apps: LotunMessageApps) {
    debug('messageApps', apps);
    this.queue.enqueue(async () => {
      await this.deleteMissingForwardPoints(apps.map(app => app.id));
      await this.upsertForwardPoints(apps);

      const deviceEntryPoints = apps
        .map(app => {
          if (app.entryPoint.type === 'DEVICE_PORT') {
            return app;
          }
          return null;
        })
        .filter(function notEmpty<TValue>(
          value: TValue | null | undefined,
        ): value is TValue {
          return value !== null && value !== undefined;
        });

      debug('lotunEntryPoints', deviceEntryPoints);

      await this.deleteMissingEntryPoints(deviceEntryPoints.map(app => app.id));
      await this.upsertEntryPoints(deviceEntryPoints);
    });
  }

  duplex(duplex: Duplex, handshakeData: unknown) {
    debug('duplex', handshakeData);
    const { appId } = handshakeData as { appId: string };

    const fp = this.forwardPointsMap.get(appId);
    if (!fp) {
      duplex.destroy();
      return;
    }

    fp.connection(duplex, handshakeData);
  }

  createDuplex(payload: any) {
    return this.lotunSocket.createDuplex(payload);
  }

  async upsertEntryPoints(apps: LotunMessageApps) {
    await Promise.all(
      apps
        .map(async app => {
          const ep = this.entryPointsMap.get(app.id);
          if (!ep) {
            const entryPoint = new EntryPoint({
              lotunSocket: this.lotunSocket,
              app,
            });
            await entryPoint.init();
            this.entryPointsMap.set(app.id, entryPoint);
          }
        })
        .map((one, index) => {
          one.catch(err => {
            debug('upsertEntryPoints.error', `appId: ${apps[index].id}`, err);
          });
          return one;
        }),
    );
  }

  async upsertForwardPoints(apps: LotunMessageApps) {
    await Promise.all([
      apps.map(async (app, index) => {
        const oldFp = this.forwardPointsMap.get(app.id);

        const newFp = new ForwardPoint({
          app: app,
          configDir: this.configDir,
        });

        try {
          await Promise.all(
            app.middlewares.map(async middleware => {
              await newFp.addMiddleware(
                {
                  id: middleware.rule.id,
                  name: middleware.rule.name,
                  version: middleware.rule.version,
                  ruleScript: middleware.rule.ruleScript,
                  optionsScript: middleware.optionsScript,
                },
                middleware.priority,
              );
            }),
          );

          this.forwardPointsMap.set(app.id, newFp);
        } catch (err) {
          debug('upsertForwardPoints.error', `appId: ${apps[index].id}`, err);
          await newFp.destroy();
        }

        if (oldFp) {
          oldFp.destroy();
        }
      }),
    ]);
  }

  getForwardPoint(id: string) {
    this.forwardPointsMap.get(id);
  }

  async deleteMissingEntryPoints(ids: string[]) {
    const missingEpIds = [...this.entryPointsMap.keys()].filter(one => {
      return !ids.includes(one);
    });
    debug('missingEpId', missingEpIds);
    await Promise.all(
      missingEpIds.map(async id => {
        const entryPoint = this.entryPointsMap.get(id);
        if (entryPoint) {
          await entryPoint.destroy();
          this.entryPointsMap.delete(id);
        }
      }),
    );
  }

  async deleteMissingForwardPoints(ids: string[]) {
    const missingFpIds = [...this.forwardPointsMap.keys()].filter(one => {
      return !ids.includes(one);
    });
    debug('missingFpId', missingFpIds);
    await Promise.all(
      missingFpIds.map(async id => {
        const forwardPoint = this.forwardPointsMap.get(id);
        if (forwardPoint) {
          await forwardPoint.destroy();
          this.forwardPointsMap.delete(id);
        }
      }),
    );
  }

  async destroy() {
    await this.queue.destroy();
    await Promise.all(
      [...this.entryPointsMap.entries()].map(async ([id, entryPoint]) => {
        await entryPoint.destroy();
        this.entryPointsMap.delete(id);
      }),
    );
    await Promise.all(
      [...this.forwardPointsMap.entries()].map(async ([id, forwardPoint]) => {
        await forwardPoint.destroy();
        this.forwardPointsMap.delete(id);
      }),
    );
  }
}

class Queue {
  private maxSimultaneously: number;
  private __active: number;
  private __queue: (() => any)[];

  constructor(maxSimultaneously = 1) {
    this.maxSimultaneously = maxSimultaneously;
    this.__active = 0;
    this.__queue = [];
  }

  async enqueue(func: () => any) {
    if (++this.__active > this.maxSimultaneously) {
      await new Promise(resolve => this.__queue.push(resolve));
    }

    try {
      return await func();
    } catch (err) {
      throw err;
    } finally {
      this.__active--;
      if (this.__queue.length > 0) {
        let func = this.__queue.shift();
        if (func) {
          func();
        }
      }
    }
  }

  async destroy() {
    await new Promise(resolve => {
      this.enqueue(resolve);
    });
  }
}
