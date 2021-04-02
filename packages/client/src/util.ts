import path from "path";
import os from "os";
import si from "systeminformation";

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getLotunDataDirPath() {
  let dataDir = process.env.LOTUN_DATA || path.join(os.homedir(), ".lotun");

  if (!path.isAbsolute(dataDir)) {
    dataDir = path.join(process.cwd(), dataDir);
  }

  return dataDir;
}

export function getLotunConfigFilePath() {
  return path.join(getLotunDataDirPath(), "config.json");
}

export function calculateTimeout(disconnectCount: number) {
  const maxTimeout = 60000;
  let timeout = 0;

  if (disconnectCount > 0) {
    const randomInterval = randomIntFromInterval(1000, 3000);
    timeout += disconnectCount * 5000 + randomInterval;
  }

  if (timeout > maxTimeout) {
    timeout = maxTimeout;
  }
  return timeout;
}

export function getCurrentLotunClientVersion() {
  const pjson = require(path.join(__dirname, "..", "package.json"));
  const version = pjson.version as string;
  return version;
}

export async function osInfo() {
  return si
    .osInfo()
    .then((res) => {
      return res;
    })
    .catch((err) => {
      return {};
    });
}

export function constants() {
  let LOTUN_ENV = process.env.LOTUN_ENV || "production";

  let API_URL = "https://api.lotun.io/graphql";
  let DEVICE_CLIENT_URL = "https://device.lotun.io";
  let DASHBOARD_URL = "https://dashboard.lotun.io";

  if (LOTUN_ENV === "stage") {
    API_URL = "https://api.stage.lotun.io/graphql";
    DEVICE_CLIENT_URL = "https://device.stage.lotun.io";
    DASHBOARD_URL = "https://dashboard.stage.lotun.io";
  }

  if (LOTUN_ENV === "devel") {
    API_URL = "https://api.devel.lotun.io/graphql";
    DEVICE_CLIENT_URL = "https://device.devel.lotun.io";
    DASHBOARD_URL = "https://dashboard.devel.lotun.io";
  }

  if (LOTUN_ENV === "local") {
    API_URL = "http://localhost:4000/graphql";
    DEVICE_CLIENT_URL = "http://localhost:4100";
    DASHBOARD_URL = "https://dashboard.devel.lotun.io";
  }

  return {
    API_URL,
    DEVICE_CLIENT_URL,
    DASHBOARD_URL,
    LOTUN_ENV,
  };
}
