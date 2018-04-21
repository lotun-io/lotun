'use strict'

const os = require('os')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const uuidv1 = require('uuid/v1')
const crypto = require('crypto')
const path = require('path')
const appPath = path.join(os.homedir(), '.lotun')

global.connectUrl = 'https://api.dev.lotun.io'
if (process.env.NODE_ENV === 'local') {
  global.connectUrl = 'http://api.lotun.local:3000'
}

const mkdirSyncP = function(location) {
    let normalizedPath = path.normalize(location);
    let parsedPathObj = path.parse(normalizedPath);
    let curDir = parsedPathObj.root;
    let folders = parsedPathObj.dir.split(path.sep);
    folders.push(parsedPathObj.base);
    for(let part of folders) {
        curDir = path.join(curDir, part);
        if (!fs.existsSync(curDir)) {
            fs.mkdirSync(curDir);
        }
    }
}

const createAppConfigFolder = function() {
  try {
    mkdirSyncP(appPath)
  } catch (e) {

  }
}

const fetchDeviceToken = function() {
  const client = require('graphql-client')({
    url: `${global.connectUrl}/graphql`,
    timeout: 10000
  })

  return client.query(`
    query {
      deviceGenerateToken {
        token
      }
    }`
  )
  .then(function(result) {
    return result.data.deviceGenerateToken.token
  })
}

// @TODO repeat when offline
const generateToken = function() {
  return fetchDeviceToken()
}

const getDeviceToken = function() {
  return new Promise(function(resolve, reject) {
    let data
    let settingsPath = path.join(appPath, 'settings.json')
    try {
      data = JSON.parse(fs.readFileSync(settingsPath))

      if (!data || !data.id) {
        throw new Error('No ID set')
      }
      resolve(data.id)
    } catch (e) {
      generateToken()
        .then(function(deviceToken) {
          data = {
            id: deviceToken
          }
          fs.writeFileSync(settingsPath, JSON.stringify(data))
          resolve(data.id)
        })
        .catch(reject)
    }
  })
}

console.log('Config folder:', appPath)
createAppConfigFolder()
getDeviceToken()
  .then(function(deviceToken) {
    require('./socket-client')({
      token: deviceToken,
      hostname: os.hostname().split('.').shift()
    })
  })
  .catch(function(err) {
    console.log('Failed to start')
    console.log(err)
  })
