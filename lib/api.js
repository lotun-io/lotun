const EventEmitter = require('events')
const socketClient = require('./socket-client')

class LotunClient extends EventEmitter {
  constructor() {
    super()
    this.connectUrl = 'https://api.dev.lotun.io'
    if (process.env.NODE_ENV === 'local') {
      this.connectUrl = 'http://api.lotun.local:3000'
    }
  }
  getNewDeviceToken() {
    const client = require('graphql-client')({
      url: `${this.connectUrl}/graphql`,
      timeout: 10000
    })

    return client.query(`
      query {
        deviceGenerateToken {
          token
        }
      }`
    )
    .then(function(result) {
      return result.data.deviceGenerateToken.token
    })
  }
  connect() {
    socketClient.createConnection(this)
  }
  setDeviceToken(token) {
    this.deviceToken = token
  }
}

module.exports = {
  create: function(options) {
    return new LotunClient(options)
  }
}
