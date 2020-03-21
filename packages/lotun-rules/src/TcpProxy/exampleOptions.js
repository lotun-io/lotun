/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

const net = require('net');
const tls = require('tls');

/**
 * @param {RuleContext} ctx
 */
module.exports = async function options(ctx) {
  return function createConnection() {
    // TCP connection
    const socket = net.connect({ host: 'localhost', port: 3000 });
    return socket;

    // TLS conneciton
    /*
    return tls.connect({ host: 'localhost', port: 3000 });
    */

    // IPC connection
    /*
    return net.connect({ path: '/var/run/postgresql/psql.sock' });
    */
  };
};
