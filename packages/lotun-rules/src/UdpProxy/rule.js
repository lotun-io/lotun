const dgram = require('dgram');
/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

/**
 * @param {RuleContext} ctx
 */
module.exports = async function rule(ctx) {
  let { createSocket, port, host } = await ctx.options(ctx);

  if (!createSocket) {
    createSocket = function() {
      return dgram.createSocket('udp4');
    };
  }

  ctx.on('udpProxySocket', function(udpProxySocket) {
    const client = createSocket();

    udpProxySocket.on('message', (msg, rinfo) => {
      client.send(msg, port, host);
    });

    udpProxySocket.on('close', () => {
      client.close();
    });
  });
};
