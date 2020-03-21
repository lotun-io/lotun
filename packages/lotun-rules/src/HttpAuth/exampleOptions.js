/**
 * @typedef {import('@lotun/client/dist/client/Rule').RuleContext} RuleContext
 */

/**
 * @param {RuleContext} ctx
 * @param {HttpAuth} auth
 * https://www.npmjs.com/package/http-auth/v/4.1.2
 */
module.exports = async function options(ctx, auth) {
  return auth.basic(
    {
      realm: 'Basic auth',
    },
    (username, password, callback) => {
      /*
      if (username === 'admin' && password === 'admin') {
        callback(true);
        return;
      }
      */

      callback(false);
    },
  );
};
