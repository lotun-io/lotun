const EventEmitter = require('events');
const graphqlClient = require('graphql-client');
const socketClient = require('./socket-client');

class LotunClient extends EventEmitter {
  constructor() {
    super();
    this.connectUrl = 'wss://device.dev.lotun.io';
    this.connectUrlApi = 'https://api.dev.lotun.io';
    if (process.env.NODE_ENV === 'local') {
      this.connectUrl = 'ws://api.lotun.local:5000';
      this.connectUrlApi = 'http://api.lotun.local:3000';
    }
    if (process.env.NODE_ENV === 'production') {
      this.connectUrl = 'wss://device.lotun.io';
      this.connectUrlApi = 'https://api.lotun.io';
    }
  }

  getNewDeviceToken() {
    const client = graphqlClient({
      url: `${this.connectUrlApi}/graphql`,
      timeout: 10000,
    });

    return client
      .query(
        `
      query {
        deviceTokenGenerate {
          token
        }
      }`,
      )
      .then(result => result.data.deviceTokenGenerate.token);
  }

  connect() {
    socketClient.createConnection(this);
  }

  setDeviceToken(token) {
    this.deviceToken = token;
  }
}

module.exports = {
  create(options) {
    return new LotunClient(options);
  },
};
