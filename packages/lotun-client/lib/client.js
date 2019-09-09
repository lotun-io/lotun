'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const events_1 = __importDefault(require('events'));
const socket_client_1 = require('./socket-client');
const axios_1 = __importDefault(require('axios'));
class LotunClient extends events_1.default {
  constructor(stage) {
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
    const res = await axios_1.default({
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
    console.log(res.data.data);
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
    socket_client_1.createConnection(this);
  }
  setDeviceToken(deviceToken) {
    this.deviceToken = deviceToken;
  }
}
exports.LotunClient = LotunClient;
//# sourceMappingURL=client.js.map
