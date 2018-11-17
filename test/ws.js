const crypto = require('crypto');

function getRandomValues(abv) {
  var l = abv.length;
  while (l--) {
    abv[l] = Math.floor(Math.random() * 256);
  }
  return abv;
}

crypto.randomBytes = function(size, cb) {
  // phantomjs needs to throw
  if (size > 65536) throw new Error('requested too many random bytes');
  // in case browserify  isn't using the Uint8Array version
  var rawBytes = new global.Uint8Array(size);

  // This will not work in older browsers.
  // See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
  if (size > 0) {
    // getRandomValues fails on IE if size == 0
    getRandomValues(rawBytes);
  }

  // XXX: phantomjs doesn't like a buffer being passed here
  var bytes = Buffer.from(rawBytes.buffer);

  if (typeof cb === 'function') {
    cb(null, bytes);
  }

  return bytes;
};

const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function() {
  console.log('open');
  ws.send('something');
});

ws.on('error', function(err) {
  console.log(err);
});

ws.on('close', function() {
  console.log('close');
});

ws.on('message', function(data) {
  console.log(data);
});
