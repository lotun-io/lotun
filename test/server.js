var http = require('http');
var https = require('https');
var fs = require('fs');
var tls = require('tls');
var path = require('path');

var httpServer = http
  .createServer(function(req, res) {
    res.end();
  })
  .listen(8080, function(err) {
    if (!err) console.log('listening on http://localhost:' + httpServer.address().port + '/');
  });

// ***** WebSocket server for chat
// remove this code to remove chat functionality

var WebSocket = require('ws');
var wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws) {
  console.log('connection');
  ws.on('message', function incoming(data) {
    console.log('broadcasting message: ' + data);
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) client.send(data);
    });
  });
});
function upgradeToWSS(req, socket, head) {
  wss.handleUpgrade(req, socket, head, function done(ws) {
    wss.emit('connection', ws, req);
  });
}

httpServer.on('upgrade', upgradeToWSS);
