/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

/**
 * @param {RuleContext} ctx
 */
module.exports = async function options(ctx) {
  // HTTP, TCP app
  ctx.on('connection', socket => {});

  // UDP app
  ctx.on('udpProxySocket', udpProxySocket => {});

  // clean up
  ctx.on('destroy', () => {});
};
