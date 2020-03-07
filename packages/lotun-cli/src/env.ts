export let API_URL: string | undefined;
export let WS_URL: string | undefined;
export let DASHBOARD_URL = 'https://dashboard.lotun.io';

let LOTUN_ENV = process.env.LOTUN_ENV || 'production';

if (LOTUN_ENV === 'stage') {
  API_URL = 'https://api.stage.lotun.io/graphql';
  WS_URL = 'https://device.stage.lotun.io';
}

if (LOTUN_ENV === 'devel') {
  API_URL = 'https://api.devel.lotun.io/graphql';
  WS_URL = 'https://device.devel.lotun.io';
}
