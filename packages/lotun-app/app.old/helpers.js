const fs = require('fs');
const { hostname } = require('os');
const { shell } = require('electron');
const { LOTUN_URL } = require('./constants');

function openPairURL(token) {
  const pairURL = `https://dashboard.${LOTUN_URL}/devices/new?token=${token}&name=${hostname()}`;
  shell.openExternal(pairURL);
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}

module.exports = { openPairURL, readFile };
