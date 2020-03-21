const { pipeline } = require('stream');
/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

/**
 * @param {RuleContext} ctx
 */
module.exports = async function rule(ctx) {
  const createConnection = await ctx.options(ctx);

  ctx.on('connection', function(socket) {
    const nextSocket = createConnection();

    pipeline(socket, nextSocket);
    pipeline(nextSocket, socket);
  });
};
