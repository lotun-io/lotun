import EventEmitter from 'events';
import { createConnection } from './socket-client';
import axios from 'axios';

export { ClientError as LotunClientError } from './wsStream/WsStream';

type StageType = 'devel' | 'stage';
export class LotunClient extends EventEmitter {
  public connectUrl: string;
  public connectUrlApi: string;
  public dashboardUrl: string;
  public deviceToken: string | undefined;

  constructor(stage?: StageType) {
    super();

    let baseUrl = 'lotun.io';

    if (stage === 'devel') {
      baseUrl = 'devel.lotun.io';
    }

    if (stage === 'stage') {
      baseUrl = 'stage.lotun.io';
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
              data {
                token
              }
            }
          }
          `,
      },
    });

    if (
      res.data &&
      res.data.data &&
      res.data.data &&
      res.data.data.generateDeviceToken &&
      res.data.data.generateDeviceToken.data
    ) {
      return res.data.data.generateDeviceToken.data.token;
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
