const http = require('http');
const dgram = require('dgram')
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`)
  server.close();
})

server.on('message', (msg, rinfo) => {
  console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`)
})

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening ${address.address}:${address.port}`)
})

server.bind(2222, '1.1.1.1')

//server.send(Buffer.from('sss'), 2222)