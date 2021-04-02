import updateNotifier from "update-notifier";

var toLocalTime = function (date: Date) {
  var d = new Date(date);
  var offset = (new Date().getTimezoneOffset() / 60) * -1;
  var n = new Date(d.getTime() + offset);
  return n;
};

export function dateFormat(date: Date, format: string) {
  date = toLocalTime(date);

  return format.replace(/%(yyyy|mm|dd|HH|MM|ss)/g, function (m) {
    switch (m) {
      case "%yyyy":
        return String(date.getFullYear()); // no leading zeros required
      case "%mm":
        m = String(1 + date.getMonth());
        break;
      case "%dd":
        m = String(date.getDate());
        break;
      case "%HH":
        m = String(date.getHours());
        break;
      case "%MM":
        m = String(date.getMinutes());
        break;
      case "%ss":
        m = String(date.getSeconds());
        break;
      default:
        return m.slice(1); // unknown code, remove %
    }
    // add leading zero if required
    return ("0" + m).slice(-2);
  });
}

export function initalizeUpdateNotifier() {
  const pkg = require("../package.json");
  updateNotifier({
    pkg,
    shouldNotifyInNpmScript: true,
    updateCheckInterval: 0,
  }).notify({ defer: false });
}
