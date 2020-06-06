import { Duplex } from 'stream';
import { debug as debugRoot } from './utils';
import { LotunSocket, LotunMessageApps, LotunMessageApp } from './LotunSocket';
import { EntryPoint } from './EntryPoint';
import { ForwardPoint } from './ForwardPoint';
import { Queue } from './Queue';

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
      await this.deleteMissingForwardPoints(apps.map((app) => app.id));
      await this.upsertForwardPoints(apps);

      const deviceEntryPoints = apps
        .map((app) => {
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

      await this.deleteMissingEntryPoints(
        deviceEntryPoints.map((app) => app.id),
      );
      await this.upsertEntryPoints(deviceEntryPoints);
    });
  }

  duplex(duplex: Duplex, handshakeData: unknown) {
    debug('duplex', handshakeData);
    const { appId } = handshakeData as { appId: string };

    const fp = this.forwardPointsMap.get(appId);
    debug(fp);

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
        .map(async (app) => {
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
          one.catch((err) => {
            debug('upsertEntryPoints.error', `appId: ${apps[index].id}`, err);
          });
          return one;
        }),
    );
  }

  async upsertForwardPoints(apps: LotunMessageApps) {
    for (const index in apps) {
      const app = apps[index];

      const oldFp = this.forwardPointsMap.get(app.id);

      const newFp = new ForwardPoint({
        app: app,
        configDir: this.configDir,
      });

      try {
        for (const middleware of app.middlewares) {
          await newFp.addMiddleware(
            {
              ...middleware,
            },
            middleware.priority,
          );
        }

        this.forwardPointsMap.set(app.id, newFp);
      } catch (err) {
        debug('upsertForwardPoints.error', `appId: ${apps[index].id}`, err);
        await newFp.destroy();
      }

      if (oldFp) {
        oldFp.destroy();
      }
    }
  }

  getForwardPoint(id: string) {
    this.forwardPointsMap.get(id);
  }

  async deleteMissingEntryPoints(ids: string[]) {
    const missingEpIds = [...this.entryPointsMap.keys()].filter((one) => {
      return !ids.includes(one);
    });
    debug('missingEpId', missingEpIds);
    await Promise.all(
      missingEpIds.map(async (id) => {
        const entryPoint = this.entryPointsMap.get(id);
        if (entryPoint) {
          await entryPoint.destroy();
          this.entryPointsMap.delete(id);
        }
      }),
    );
  }

  async deleteMissingForwardPoints(ids: string[]) {
    const missingFpIds = [...this.forwardPointsMap.keys()].filter((one) => {
      return !ids.includes(one);
    });
    debug('missingFpId', missingFpIds);
    await Promise.all(
      missingFpIds.map(async (id) => {
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
