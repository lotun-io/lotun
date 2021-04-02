import { GraphQLClient } from 'graphql-request';
import * as Dom from 'graphql-request/dist/types.dom';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  JSONObject: any;
};

export type Account = Node & {
  __typename?: 'Account';
  id: Scalars['ID'];
  name: Scalars['String'];
  plan: AccountPlanEnum;
  status: AccountStatusEnum;
  quota: AccountQuota;
  locks?: Maybe<Array<AccountLock>>;
  customer?: Maybe<AccountCustomer>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type AccountCustomer = {
  __typename?: 'AccountCustomer';
  name: Scalars['String'];
  email: Scalars['String'];
  address: CustomerAddress;
  taxLocation?: Maybe<CustomerTaxLocation>;
  taxId?: Maybe<CustomerTaxId>;
  taxExempt: TaxExemptEnum;
};

export type AccountLock = {
  __typename?: 'AccountLock';
  type: AccountLockTypeEnum;
  reason: Scalars['String'];
};

export type AccountLockTypeEnum =
  | 'FREE_PLAN'
  | 'PAST_DUE'
  | 'CLOSE_ACCOUNT'
  | 'FREEZE';

export type AccountPlanEnum =
  | 'FREE'
  | 'PAID';

export type AccountQuota = {
  __typename?: 'AccountQuota';
  device: QuotaStatus;
  externalPortApp: QuotaStatus;
  devicePortApp: QuotaStatus;
  hostnameApp: QuotaStatus;
};

export type AccountStatusEnum =
  | 'ACTIVE'
  | 'LOCKED';

export type Aggregate = {
  __typename?: 'Aggregate';
  count: Scalars['Int'];
};

export type App = HostnameApp | ExternalPortApp | DevicePortApp;

export type AppHttpMiddlewares = {
  __typename?: 'AppHttpMiddlewares';
  http?: Maybe<HttpMiddlewares>;
};

export type AppMiddlewares = AppHttpMiddlewares | AppTcpMiddlewares;

export type AppMiddlewaresInput = {
  http?: Maybe<HttpMiddlewaresInput>;
  tcp?: Maybe<TcpMiddlewaresInput>;
};

export type AppTcpMiddlewares = {
  __typename?: 'AppTcpMiddlewares';
  tcp?: Maybe<TcpMiddlewares>;
};

export type AppTypeEnum =
  | 'HOSTNAME'
  | 'EXTERNAL_PORT'
  | 'DEVICE_PORT';

export type AppsConnection = Connection & {
  __typename?: 'AppsConnection';
  edges: Array<AppsEdge>;
  pageInfo: PageInfo;
  aggregate: Aggregate;
};

export type AppsEdge = Edge & {
  __typename?: 'AppsEdge';
  node: App;
  cursor: Scalars['String'];
};

export type AppsFilterInput = {
  type?: Maybe<AppTypeEnum>;
};

export type AppsOrderByInput = {
  sort: AppsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type AppsOrderBySortEnum =
  | 'CREATED_AT';

export type AppsPayload = AppsConnection | ValidationError;

export type BillingPortalSession = {
  __typename?: 'BillingPortalSession';
  url: Scalars['String'];
};

export type Certificate = {
  __typename?: 'Certificate';
  commonName?: Maybe<Scalars['String']>;
  dnsNames?: Maybe<Array<Scalars['String']>>;
  isReady: Scalars['Boolean'];
  message?: Maybe<Scalars['String']>;
};

export type CheckoutSession = {
  __typename?: 'CheckoutSession';
  id: Scalars['String'];
};

export type Connection = {
  edges: Array<Edge>;
  pageInfo?: Maybe<PageInfo>;
  aggregate?: Maybe<Aggregate>;
};

export type ContinentEnum =
  | 'EUROPE';

export type CreateDeviceInput = {
  name?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
};

export type CreateDevicePayload = Device | ValidationError;

export type CreateDevicePortAppInput = {
  name?: Maybe<Scalars['String']>;
  entryPoint?: Maybe<CreateDevicePortInput>;
  deviceId?: Maybe<Scalars['ID']>;
  middlewares?: Maybe<AppMiddlewaresInput>;
};

export type CreateDevicePortAppPayload = DevicePortApp | ValidationError;

export type CreateDevicePortInput = {
  port: Scalars['String'];
  deviceId: Scalars['ID'];
};

export type CreateExternalPortAppInput = {
  name?: Maybe<Scalars['String']>;
  deviceId?: Maybe<Scalars['ID']>;
  middlewares?: Maybe<AppMiddlewaresInput>;
};

export type CreateExternalPortAppPayload = ExternalPortApp | ValidationError;

export type CreateExternalPortInput = {
  zone?: Maybe<ZoneEnum>;
};

export type CreateHostnameAppInput = {
  name?: Maybe<Scalars['String']>;
  entryPoint: CreateHostnameInput;
  deviceId?: Maybe<Scalars['ID']>;
  middlewares?: Maybe<AppMiddlewaresInput>;
};

export type CreateHostnameAppPayload = HostnameApp | ValidationError;

export type CreateHostnameInput = {
  hostname: Scalars['String'];
  path?: Maybe<Scalars['String']>;
};

export type CustomerAddress = {
  __typename?: 'CustomerAddress';
  line1: Scalars['String'];
  line2?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  country: Scalars['String'];
  postalCode?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
};

export type CustomerAddressInput = {
  line1: Scalars['String'];
  line2?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  country: Scalars['String'];
  postalCode?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
};

export type CustomerTaxId = {
  __typename?: 'CustomerTaxId';
  type: TaxIdTypeEnum;
  value: Scalars['String'];
};

export type CustomerTaxLocation = {
  __typename?: 'CustomerTaxLocation';
  jurisdiction: Scalars['String'];
  percentage: Scalars['String'];
  displayName: Scalars['String'];
};

export type DeleteAppPayload = HostnameApp | ExternalPortApp | DevicePortApp | ValidationError;

export type DeleteChecks = {
  __typename?: 'DeleteChecks';
  closed: Scalars['Boolean'];
  usageReportFinished: Scalars['Boolean'];
  lastInvoiceCreated: Scalars['Boolean'];
  invoicesPaid: Scalars['Boolean'];
};

export type DeleteDevicePayload = Device | ValidationError;

export type Device = Node & {
  __typename?: 'Device';
  id: Scalars['ID'];
  name: Scalars['String'];
  token: Scalars['String'];
  status: DeviceStatusEnum;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type DeviceClient = Node & {
  __typename?: 'DeviceClient';
  id: Scalars['ID'];
  clientVersion: Scalars['String'];
  ip: Scalars['String'];
  os?: Maybe<DeviceClientOs>;
  geo?: Maybe<DeviceClientGeo>;
  location: Location;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type DeviceClientGeo = {
  __typename?: 'DeviceClientGeo';
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  latitude?: Maybe<Scalars['String']>;
  longitude?: Maybe<Scalars['String']>;
};

export type DeviceClientOs = {
  __typename?: 'DeviceClientOs';
  distro?: Maybe<Scalars['String']>;
  release?: Maybe<Scalars['String']>;
  codename?: Maybe<Scalars['String']>;
  kernel?: Maybe<Scalars['String']>;
  arch?: Maybe<Scalars['String']>;
  hostname?: Maybe<Scalars['String']>;
  codepage?: Maybe<Scalars['String']>;
  logofile?: Maybe<Scalars['String']>;
  build?: Maybe<Scalars['String']>;
};

export type DeviceClientsConnection = Connection & {
  __typename?: 'DeviceClientsConnection';
  edges: Array<DeviceClientsEdge>;
  pageInfo: PageInfo;
  aggregate: Aggregate;
};

export type DeviceClientsConnectionPayload = DeviceClientsConnection | ValidationError;

export type DeviceClientsEdge = Edge & {
  __typename?: 'DeviceClientsEdge';
  node: DeviceClient;
  cursor: Scalars['String'];
};

export type DeviceClientsOrderByInput = {
  sort: DeviceClientsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type DeviceClientsOrderBySortEnum =
  | 'CREATED_AT';

export type DevicePort = {
  __typename?: 'DevicePort';
  portType: PortTypeEnum;
  port: Scalars['String'];
  device?: Maybe<Device>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type DevicePortApp = Node & {
  __typename?: 'DevicePortApp';
  id: Scalars['ID'];
  name: Scalars['String'];
  entryPoint?: Maybe<DevicePort>;
  device?: Maybe<Device>;
  middlewares?: Maybe<AppMiddlewares>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type DeviceStatusEnum =
  | 'ONLINE'
  | 'OFFLINE';

export type DevicesConnection = Connection & {
  __typename?: 'DevicesConnection';
  edges: Array<DevicesEdge>;
  pageInfo: PageInfo;
  aggregate: Aggregate;
};

export type DevicesEdge = Edge & {
  __typename?: 'DevicesEdge';
  node: Device;
  cursor: Scalars['String'];
};

export type DevicesOrderByInput = {
  sort: DevicesOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type DevicesOrderBySortEnum =
  | 'CREATED_AT';

export type DevicesPayload = DevicesConnection | ValidationError;

export type Edge = {
  cursor: Scalars['String'];
};

export type ExternalIp = Node & {
  __typename?: 'ExternalIp';
  id: Scalars['ID'];
  ipv4: Scalars['String'];
  hostname: Scalars['String'];
  location: Location;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type ExternalIpsConnection = Connection & {
  __typename?: 'ExternalIpsConnection';
  edges: Array<ExternalIpsEdge>;
  pageInfo: PageInfo;
  aggregate: Aggregate;
};

export type ExternalIpsConnectionPayload = ExternalIpsConnection | ValidationError;

export type ExternalIpsEdge = Edge & {
  __typename?: 'ExternalIpsEdge';
  node: ExternalIp;
  cursor: Scalars['String'];
};

export type ExternalIpsOrderByInput = {
  sort: ExternalIpsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type ExternalIpsOrderBySortEnum =
  | 'CREATED_AT';

export type ExternalPort = {
  __typename?: 'ExternalPort';
  portType: PortTypeEnum;
  port: Scalars['String'];
  externalIp?: Maybe<ExternalIp>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type ExternalPortApp = Node & {
  __typename?: 'ExternalPortApp';
  id: Scalars['ID'];
  name: Scalars['String'];
  entryPoint?: Maybe<ExternalPort>;
  device?: Maybe<Device>;
  middlewares?: Maybe<AppMiddlewares>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type GenerateDeviceToken = {
  __typename?: 'GenerateDeviceToken';
  deviceToken: Scalars['String'];
};

export type GenerateDeviceTokenPayload = GenerateDeviceToken;

export type GenerateName = {
  __typename?: 'GenerateName';
  name: Scalars['String'];
};

export type GenerateNamePayload = GenerateName;

export type GenerateSubdomain = {
  __typename?: 'GenerateSubdomain';
  subdomain: Scalars['String'];
};

export type GenerateSubdomainPayload = GenerateSubdomain;

export type Hostname = {
  __typename?: 'Hostname';
  hostname: Scalars['String'];
  path?: Maybe<Scalars['String']>;
  isWildcard: Scalars['Boolean'];
  isVerified: Scalars['Boolean'];
  dnsRecords: Array<HostnameDnsRecord>;
  certificate?: Maybe<Certificate>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type HostnameApp = Node & {
  __typename?: 'HostnameApp';
  id: Scalars['ID'];
  name: Scalars['String'];
  entryPoint?: Maybe<Hostname>;
  device?: Maybe<Device>;
  middlewares?: Maybe<AppMiddlewares>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type HostnameDnsRecord = {
  __typename?: 'HostnameDnsRecord';
  type: HostnameDnsRecordType;
  name: Scalars['String'];
  value: Scalars['String'];
  isSet: Scalars['Boolean'];
};

export type HostnameDnsRecordType =
  | 'CNAME'
  | 'A';

export type HttpMiddlewares = {
  __typename?: 'HttpMiddlewares';
  proxy: HttpProxyMiddleware;
};

export type HttpMiddlewaresInput = {
  proxy: HttpProxyMiddlewareInput;
};

export type HttpProxyMiddleware = {
  __typename?: 'HttpProxyMiddleware';
  target?: Maybe<Scalars['String']>;
};

export type HttpProxyMiddlewareInput = {
  target?: Maybe<Scalars['String']>;
};


export type Location = {
  __typename?: 'Location';
  continent: ContinentEnum;
  region: RegionEnum;
  zone: ZoneEnum;
};

export type LotunDomains = {
  __typename?: 'LotunDomains';
  domains: Array<Scalars['String']>;
};

export type LotunDomainsPayload = LotunDomains;

export type MePayload = User;

export type Mutation = {
  __typename?: 'Mutation';
  unlockAccount: Account;
  updateAccount: Account;
  verifyTaxId: TaxId;
  createCheckoutSession?: Maybe<CheckoutSession>;
  createBillingPortalSession?: Maybe<BillingPortalSession>;
  closeAccount: Account;
  deleteAccount: Account;
  createHostnameApp: CreateHostnameAppPayload;
  updateHostnameApp: UpdateHostnameAppPayload;
  verifyHostnameApp: VerifyHostnameAppPayload;
  createExternalPortApp: CreateExternalPortAppPayload;
  updateExternalPortApp: UpdateExternalPortAppPayload;
  createDevicePortApp: CreateDevicePortAppPayload;
  updateDevicePortApp: UpdateDevicePortAppPayload;
  deleteApp: DeleteAppPayload;
  createDevice: CreateDevicePayload;
  updateDevice: UpdateDevicePayload;
  deleteDevice: DeleteDevicePayload;
  updateMe: UpdateMePayload;
};


export type MutationUpdateAccountArgs = {
  input: UpdateAccountInput;
};


export type MutationVerifyTaxIdArgs = {
  input: TaxIdInput;
};


export type MutationCreateHostnameAppArgs = {
  input: CreateHostnameAppInput;
};


export type MutationUpdateHostnameAppArgs = {
  id: Scalars['ID'];
  input: UpdateHostnameAppInput;
};


export type MutationVerifyHostnameAppArgs = {
  id: Scalars['ID'];
};


export type MutationCreateExternalPortAppArgs = {
  input: CreateExternalPortAppInput;
};


export type MutationUpdateExternalPortAppArgs = {
  id: Scalars['ID'];
  input: UpdateExternalPortAppInput;
};


export type MutationCreateDevicePortAppArgs = {
  input: CreateDevicePortAppInput;
};


export type MutationUpdateDevicePortAppArgs = {
  id: Scalars['ID'];
  input: UpdateDevicePortAppInput;
};


export type MutationDeleteAppArgs = {
  id: Scalars['ID'];
};


export type MutationCreateDeviceArgs = {
  input?: Maybe<CreateDeviceInput>;
};


export type MutationUpdateDeviceArgs = {
  id: Scalars['ID'];
  input: UpdateDeviceInput;
};


export type MutationDeleteDeviceArgs = {
  id: Scalars['ID'];
};


export type MutationUpdateMeArgs = {
  input: UpdateMeInput;
};

export type Node = {
  id: Scalars['ID'];
};

export type OrderByDirectionEnum =
  | 'ASC'
  | 'DESC';

export type PageInfo = {
  __typename?: 'PageInfo';
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['String']>;
  endCursor?: Maybe<Scalars['String']>;
  pageNumber: Scalars['Int'];
  pagesCount: Scalars['Int'];
};

export type PortTypeEnum =
  | 'TCP'
  | 'UDP';

export type Query = {
  __typename?: 'Query';
  apps: AppsPayload;
  lotunDomains: LotunDomainsPayload;
  deviceClients: DeviceClientsConnectionPayload;
  devices: DevicesPayload;
  externalIps: ExternalIpsConnectionPayload;
  generateDeviceToken: GenerateDeviceTokenPayload;
  generateName: GenerateNamePayload;
  generateSubdomain: GenerateSubdomainPayload;
  node?: Maybe<Node>;
  search: Array<Node>;
  me: MePayload;
};


export type QueryAppsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
};


export type QueryDeviceClientsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<DeviceClientsOrderByInput>;
};


export type QueryDevicesArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
};


export type QueryExternalIpsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<ExternalIpsOrderByInput>;
};


export type QueryNodeArgs = {
  id: Scalars['ID'];
};


export type QuerySearchArgs = {
  query: Scalars['String'];
};

export type QuotaStatus = {
  __typename?: 'QuotaStatus';
  limit?: Maybe<Scalars['Int']>;
  current: Scalars['Int'];
};

export type RegionEnum =
  | 'EUROPE_WEST3';

export type TaxExemptEnum =
  | 'REVERSE'
  | 'EXEMPT'
  | 'NONE';

export type TaxId = {
  __typename?: 'TaxId';
  type: TaxIdTypeEnum;
  value: Scalars['String'];
  status?: Maybe<TaxIdStatusEnum>;
};

export type TaxIdInput = {
  value: Scalars['String'];
  type: TaxIdTypeEnum;
};

export type TaxIdStatusEnum =
  | 'PENDING'
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'UNAVAILABLE';

export type TaxIdTypeEnum =
  | 'AE_TRN'
  | 'AU_ABN'
  | 'BR_CNPJ'
  | 'BR_CPF'
  | 'CA_BN'
  | 'CA_QST'
  | 'CH_VAT'
  | 'CL_TIN'
  | 'ES_CIF'
  | 'EU_VAT'
  | 'HK_BR'
  | 'ID_NPWP'
  | 'IN_GST'
  | 'JP_CN'
  | 'KR_BRN'
  | 'LI_UID'
  | 'MX_RFC'
  | 'MY_FRP'
  | 'MY_ITN'
  | 'MY_SST'
  | 'NO_VAT'
  | 'NZ_GST'
  | 'RU_INN'
  | 'SA_VAT'
  | 'SG_GST'
  | 'SG_UEN'
  | 'TH_VAT'
  | 'TW_VAT'
  | 'US_EIN'
  | 'ZA_VAT';

export type TcpMiddlewares = {
  __typename?: 'TcpMiddlewares';
  proxy: TcpProxyMiddleware;
};

export type TcpMiddlewaresInput = {
  proxy: TcpProxyMiddlewareInput;
};

export type TcpProxyMiddleware = {
  __typename?: 'TcpProxyMiddleware';
  target: Scalars['String'];
};

export type TcpProxyMiddlewareInput = {
  target: Scalars['String'];
};

export type UpdateAccountCustomerInput = {
  name: Scalars['String'];
  email: Scalars['String'];
  address: CustomerAddressInput;
  taxId?: Maybe<TaxIdInput>;
};

export type UpdateAccountInput = {
  name?: Maybe<Scalars['String']>;
  customer?: Maybe<UpdateAccountCustomerInput>;
  checkoutSessionId?: Maybe<Scalars['String']>;
};

export type UpdateDeviceInput = {
  name?: Maybe<Scalars['String']>;
};

export type UpdateDevicePayload = Device | ValidationError;

export type UpdateDevicePortAppInput = {
  name?: Maybe<Scalars['String']>;
  entryPoint?: Maybe<UpdateDevicePortInput>;
  deviceId?: Maybe<Scalars['ID']>;
  middlewares?: Maybe<AppMiddlewaresInput>;
};

export type UpdateDevicePortAppPayload = DevicePortApp | ValidationError;

export type UpdateDevicePortInput = {
  port?: Maybe<Scalars['String']>;
  deviceId?: Maybe<Scalars['ID']>;
};

export type UpdateExternalPortAppInput = {
  name?: Maybe<Scalars['String']>;
  deviceId?: Maybe<Scalars['ID']>;
  middlewares?: Maybe<AppMiddlewaresInput>;
};

export type UpdateExternalPortAppPayload = ExternalPortApp | ValidationError;

export type UpdateHostnameAppInput = {
  name?: Maybe<Scalars['String']>;
  entryPoint?: Maybe<UpdateHostnameInput>;
  deviceId?: Maybe<Scalars['ID']>;
  middlewares?: Maybe<AppMiddlewaresInput>;
};

export type UpdateHostnameAppPayload = HostnameApp | ValidationError;

export type UpdateHostnameInput = {
  hostname?: Maybe<Scalars['String']>;
  path?: Maybe<Scalars['String']>;
};

export type UpdateMeInput = {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
};

export type UpdateMePayload = User | ValidationError;

export type User = Node & {
  __typename?: 'User';
  id: Scalars['ID'];
  email: Scalars['String'];
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  account?: Maybe<Account>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type ValidationError = {
  __typename?: 'ValidationError';
  errors: Array<ValidationErrorObject>;
};

export type ValidationErrorCodeEnum =
  | 'INVALID_FORMAT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'NOT_UNIQUE'
  | 'MIN'
  | 'MAX';

export type ValidationErrorObject = {
  __typename?: 'ValidationErrorObject';
  code: ValidationErrorCodeEnum;
  path: Array<Scalars['String']>;
  message: Scalars['String'];
};

export type VerifyHostnameAppPayload = HostnameApp | ValidationError;

export type ZoneEnum =
  | 'EUROPE_WEST3_B';

export type GenerateDeviceTokenQueryVariables = Exact<{ [key: string]: never; }>;


export type GenerateDeviceTokenQuery = (
  { __typename?: 'Query' }
  & { generateDeviceToken: (
    { __typename: 'GenerateDeviceToken' }
    & Pick<GenerateDeviceToken, 'deviceToken'>
  ) }
);


export const GenerateDeviceTokenDocument = gql`
    query generateDeviceToken {
  generateDeviceToken {
    ... on GenerateDeviceToken {
      deviceToken
      __typename
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = sdkFunction => sdkFunction();
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    generateDeviceToken(variables?: GenerateDeviceTokenQueryVariables, requestHeaders?: Dom.RequestInit["headers"]): Promise<GenerateDeviceTokenQuery> {
      return withWrapper(() => client.request<GenerateDeviceTokenQuery>(GenerateDeviceTokenDocument, variables, requestHeaders));
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;