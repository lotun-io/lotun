import { pipeline } from 'stream';
/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

/**
 * @param {RuleContext} ctx
 */
module.exports = async function rule(ctx) {
  const server = await ctx.options(ctx);

  server.on('secureConnection', tlsSocket => {
    const { remoteAddress, remotePort } = tlsSocket;
    const nextSocket = ctx.nextMiddlewareSocket({
      remoteAddress,
      remotePort,
    });

    pipeline(socket, nextSocket);
    pipeline(nextSocket, socket);
  });

  ctx.on('connection', function(socket) {
    server.emit('connection', socket);
  });
};
