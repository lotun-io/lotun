const os = require('os')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const lotunClient = require('./api').create()
const argv = require('minimist')(process.argv.slice(2))
/*
  --deviceToken
  -t
  --config
  -c
*/

const generateDeviceToken = async function() {
  let token = null
  while(!token) {
    try {
      token = await lotunClient.getNewDeviceToken()
    } catch(err) {
      await new Promise(function(resolve) {
        setTimeout(function() {
          resolve()
        }, 5000)
      })
    }
  }
  return token
}

const getDeviceToken = async function() {
  let data
  let configDir = path.dirname(config)
  console.log(`Config path: ${config}`)
  try {
    data = fs.readFileSync(config)
    try {
      data = JSON.parse(data)
    } catch (err) {
      console.error(err)
      throw new Error(`Cannot parse data from config ${config}`)
    }
  } catch (err) {
    // file not exists, create file and fetch token
    console.log('Generate new device token')
    const deviceToken = await generateDeviceToken()
    data = {
      deviceToken: deviceToken
    }

    try {
      mkdirp.sync(configDir)
      fs.writeFileSync(config, JSON.stringify(data))
    } catch (e) {
      console.error(e)
      throw new Error(`Cannot write to config ${config}`)
    }
  }
  if (!data || !data.deviceToken) {
    throw new Error(`Cannot read from config ${config} bad format`)
  }
  return data.deviceToken
}

let config
let lastError

(async function() {
  if (argv.c || argv.config) {
    config = path.normalize(argv.c || argv.config)
  } else {
    config = path.join(os.homedir(), '.lotun', 'config.json')
  }

  let deviceToken = null
  if (argv.t || argv.deviceToken) {
    deviceToken = argv.t || argv.deviceToken
  } else {
    deviceToken = await getDeviceToken()
  }

  lotunClient.setDeviceToken(deviceToken)

  lotunClient.on('connect', function() {
    console.log('Device connected, setup your device from web app')
    console.log(`https://dashboard.dev.lotun.io`)
  })

  lotunClient.on('error', function(err) {
    if (err === 'not authorized' && lastError != err) {
      console.log('Not authorized, please pair your device using this url')
      console.log(`https://dashboard.dev.lotun.io/create-device?token=${encodeURIComponent(deviceToken)}&name=${encodeURIComponent(os.hostname())}`)
    }

    lastError = err
  })

  lotunClient.on('disconnect', function(reason) {
    console.log('Disconnect')
  })

  lotunClient.connect()
})().catch(function (err) {
  console.error(err)
})
