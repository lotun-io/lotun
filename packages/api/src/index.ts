import { GraphQLClient } from 'graphql-request';
import { getSdk } from './sdk';
export { Sdk as LotunApi } from './sdk';

export type LotunApiOptions = {
  apiKey?: string;
  apiUrl?: string;
};

export function createLotunApi(options: LotunApiOptions) {
  let { apiKey, apiUrl } = options;

  let headers: Record<string, string> = {};

  if (!apiUrl) {
    apiUrl = 'https://api.lotun.io/graphql';
  }

  if (apiKey) {
    headers.authorization = `Basic ${Buffer.from(apiKey).toString('base64')}`;
  }

  const client = new GraphQLClient(apiUrl, { headers });
  const api = getSdk(client);

  return api;
}
