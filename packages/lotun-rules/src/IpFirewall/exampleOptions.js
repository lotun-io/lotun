/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

const ipRangeCheck = require('ip-range-check@0.2.0');

/**
 * @param {RuleContext} ctx
 */
module.exports = async function options(ctx) {
  const allowedList = [];

  /**
   * @param {string} remoteAddress
   * @returns {boolean}
   */
  return function firewall(remoteAddress) {
    return ipRangeCheck(remoteAddress, allowedList);
  };
};
