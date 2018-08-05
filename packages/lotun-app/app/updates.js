const { autoUpdater } = require('electron-updater');

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify();
}

module.exports = {
  checkForUpdates,
};
