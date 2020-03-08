import fs from 'fs';
import { hostname } from 'os';
import { shell } from 'electron';
import { LOTUN_URL } from './constants';

export function openPairURL(token: string) {
  const pairURL = `https://dashboard.${LOTUN_URL}/devices/new?token=${token}&name=${hostname()}`;
  shell.openExternal(pairURL);
}

export function readFile(filePath: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
}
