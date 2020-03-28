/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

const net = require('net');
const tls = require('tls');

/**
 * @param {RuleContext} ctx
 */
module.exports = async function options(ctx) {
  return {
    host: 'localhost',
    port: 3000,
  };
};
