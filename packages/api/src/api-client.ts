import "cross-fetch/polyfill";
import { GraphQLClient } from "graphql-request";
import { getSdk } from "./sdk";

export { Sdk as GqlSdk } from "./sdk";

class ApiClient {
  constructor(private sdk: ReturnType<typeof getSdk>) {}
  async generateDeviceToken() {
    const { generateDeviceToken } = await this.sdk.generateDeviceToken();
    return generateDeviceToken.deviceToken;
  }
}

export type CreateApiClientOptions = {
  apiUrl?: string;
};

export const createApiClient = (options?: CreateApiClientOptions) => {
  let { apiUrl } = options || {};

  if (!apiUrl) {
    apiUrl = "https://api.lotun.io/graphql";
  }

  const client = new GraphQLClient(apiUrl);

  const sdk = getSdk(client);

  const api = new ApiClient(sdk);
  return api;
};
