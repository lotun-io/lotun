'use strict'

const os = require('os')
const fs = require('fs')
const uuidv4 = require('uuid/v4')
const uuidv1 = require('uuid/v1')
const crypto = require('crypto')
const path = require('path')
const appPath = path.join(os.homedir(), '.lotun')

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

const generateId = function() {
  return uuidv4()
}

const getId = function() {
  let data
  let settingsPath = path.join(appPath, 'settings.json')
  try {
    data = JSON.parse(fs.readFileSync(settingsPath))

    if (!data || !data.id) {
      throw new Error('No ID set')
    }
  } catch (e) {
    data = {
      id: generateId()
    }

    fs.writeFileSync(settingsPath, JSON.stringify(data))
  }
  return data.id
}

console.log('Config folder:', appPath)
createAppConfigFolder()
require('./socket-client')({
  token: getId(),
  hostname: os.hostname().split('.').shift()
})
