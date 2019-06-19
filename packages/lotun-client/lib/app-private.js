'use strict';
/*
const net = require('net');

class AppPrivate {
  constructor() {
    this.servers = [];
  }

  createServer(options) {
    const server = net.createServer(socket => {
      const stream = this.websocketStream.createStream(options);

      socket.pipe(stream).pipe(socket);
    });

    server.listen({
      host: options.entry.hostname,
      port: options.entry.port,
    });

    this.servers.push(server);
  }

  closeAll() {
    this.servers.forEach(one => {
      this.closeServer(one);
    });
  }


  closeServer(server) {
    server.close();
  }
}

module.exports = new AppPrivate();
*/
//# sourceMappingURL=app-private.js.map
