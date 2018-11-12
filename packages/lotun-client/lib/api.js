const EventEmitter = require('events');
const graphqlClient = require('graphql-client');
const socketClient = require('./socket-client');

class LotunClient extends EventEmitter {
  constructor() {
    super();
    this.connectUrl = 'wss://device.lotun.io';
    this.connectUrlApi = 'https://api.lotun.io';

    if (process.env.NODE_ENV === 'local') {
      this.connectUrl = 'wss://device.loc.lotun.io';
      this.connectUrlApi = 'https://api.loc.lotun.io';
    }
    if (process.env.NODE_ENV === 'devel') {
      this.connectUrl = 'wss://device.dev.lotun.io';
      this.connectUrlApi = 'https://api.dev.lotun.io';
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
          generateDeviceToken {
            token
          }
        }`,
      )
      .then(result => result.data.generateDeviceToken.token);
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
