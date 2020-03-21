const { pipeline } = require('stream');
/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

/**
 * @param {RuleContext} ctx
 */
module.exports = async function rule(ctx) {
  const firewall = await ctx.options(ctx);

  ctx.on('connection', function(socket) {
    const isAllowed = firewall(socket.remoteAddress);
    if (Boolean(isAllowed) === false) {
      socket.destroy();
      return;
    }

    const { remoteAddress, remotePort } = socket;
    const nextSocket = ctx.nextMiddlewareSocket({
      remoteAddress,
      remotePort,
    });

    pipeline(socket, nextSocket);
    pipeline(nextSocket, socket);
  });

  ctx.on('udpProxySocket', function(udpProxySocket) {
    const isAllowed = firewall(udpProxySocket.rinfo.address);
    if (Boolean(isAllowed) === false) {
      udpProxySocket.destroy();
      return;
    }

    this.nextMiddleware(udpProxySocket);
  });
};
