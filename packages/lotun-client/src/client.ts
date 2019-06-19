import EventEmitter from 'events';
import { createConnection } from './socket-client';
import axios from 'axios';

export { ClientError as LotunClientError } from './wsStream/WsStream';

type StageType = 'local' | 'devel';
export class LotunClient extends EventEmitter {
  public connectUrl: string;
  public connectUrlApi: string;
  public dashboardUrl: string;
  public deviceToken: string | undefined;

  constructor(stage?: StageType) {
    super();

    let baseUrl = 'lotun.io';

    if (stage === 'devel') {
      baseUrl = 'dev.lotun.io';
    }

    if (stage === 'local') {
      baseUrl = 'loc.lotun.io';
    }

    this.connectUrl = `wss://device.${baseUrl}`;
    this.connectUrlApi = `https://api.${baseUrl}/graphql`;
    this.dashboardUrl = `https://dashboard.${baseUrl}`;
  }

  async generateDeviceToken() {
    const res = await axios({
      url: this.connectUrlApi,
      method: 'post',
      data: {
        query: `
          query {
            generateDeviceToken {
              token
            }
          }
          `,
      },
    });

    if (res.data && res.data.data && res.data.data.generateDeviceToken) {
      return res.data.data.generateDeviceToken.token;
    } else {
      throw new Error('Cannot generate token');
    }
  }

  connect() {
    createConnection(this);
  }

  setDeviceToken(deviceToken: string) {
    this.deviceToken = deviceToken;
  }
}
