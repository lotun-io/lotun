const si = require('systeminformation')
const defaultGateway = require('default-gateway')
const arp = require('arp')
const os = require('os')
const fs = require('fs')
const clientVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version

module.exports = function getSystemInfo() {
  return Promise.all([
    si.system(),
    si.bios(),
    si.baseboard(),
    si.osInfo(),
    si.versions(),
    si.cpu(),
    si.cpuFlags(),
    si.graphics(),
    si.networkInterfaces(),
    si.networkInterfaceDefault(),
    si.memLayout(),
    si.diskLayout(),
    defaultGateway.v4()
      .then((res) => {
        return new Promise((resolve) => {
          arp.getMAC(res.gateway, (err, mac) => {
            if (err) {

            } else {
              res.mac = mac
            }
            resolve(res)
          })
        })
      })
  ]).then((res) => {
    const data = {}
    data.system = res[0]
    data.bios = res[1]
    data.baseboard = res[2]
    data.os = res[3]
    data.versions = res[4]
    data.cpu = res[5]
    data.cpu.flags = res[6]
    data.graphics = res[7]
    data.net = res[8]
    data.netDefault = data.net.filter((one) => {
      if (one.iface === res[9]) {
        return true
      }
      return false
    }).shift()
    data.memLayout = res[10]
    data.diskLayout = res[11]
    data.gatewayDefault = res[12]
    data.userInfo = os.userInfo()

    data.versions.lotun = clientVersion
    return data
  })
}
