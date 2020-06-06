import { GraphQLClient } from 'graphql-request';
import { print } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** ID Global */
  IDGlobal: any;
};

export type Account = Node & {
  __typename?: 'Account';
  id: Scalars['ID'];
  name: Scalars['String'];
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export enum AppTypeEnum {
  Http = 'HTTP',
  Tcp = 'TCP',
  Udp = 'UDP',
}

export type ForwardPoint = {
  __typename?: 'ForwardPoint';
  device?: Maybe<Device>;
  middlewares: MiddlewaresConnection;
};

export type App = {
  id: Scalars['ID'];
  type: AppTypeEnum;
  name: Scalars['String'];
  entryPoint?: Maybe<EntryPoint>;
  forwardPoint?: Maybe<ForwardPoint>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type HttpApp = App &
  Node & {
    __typename?: 'HttpApp';
    id: Scalars['ID'];
    type: AppTypeEnum;
    name: Scalars['String'];
    entryPoint?: Maybe<EntryPoint>;
    forwardPoint?: Maybe<ForwardPoint>;
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
    entryPath: Scalars['String'];
  };

export type TcpApp = App &
  Node & {
    __typename?: 'TcpApp';
    id: Scalars['ID'];
    type: AppTypeEnum;
    name: Scalars['String'];
    entryPoint?: Maybe<EntryPoint>;
    forwardPoint?: Maybe<ForwardPoint>;
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
  };

export type UdpApp = App &
  Node & {
    __typename?: 'UdpApp';
    id: Scalars['ID'];
    type: AppTypeEnum;
    name: Scalars['String'];
    entryPoint?: Maybe<EntryPoint>;
    forwardPoint?: Maybe<ForwardPoint>;
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
  };

export type AppsConnection = {
  __typename?: 'AppsConnection';
  edges: Array<AppsEdge>;
  pageInfo: ConnectionPageInfo;
};

export type AppsEdge = {
  __typename?: 'AppsEdge';
  node: App;
  cursor?: Maybe<Scalars['String']>;
};

export enum AppsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type AppsOrderByInput = {
  sort: AppsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type AppsFilterInput = {
  entryPointId?: Maybe<Scalars['IDGlobal']>;
  type?: Maybe<AppTypeEnum>;
};

export type CreateHttpApp = {
  name?: Maybe<Scalars['String']>;
  entryPath?: Maybe<Scalars['String']>;
  entryPointId: Scalars['IDGlobal'];
  forwardPoint: ForwardPointInput;
};

export type CreateTcpApp = {
  name?: Maybe<Scalars['String']>;
  entryPointId: Scalars['IDGlobal'];
  forwardPoint: ForwardPointInput;
};

export type CreateUdpApp = {
  name?: Maybe<Scalars['String']>;
  entryPointId: Scalars['IDGlobal'];
  forwardPoint: ForwardPointInput;
};

export type ForwardPointInput = {
  deviceId: Scalars['IDGlobal'];
  host?: Maybe<Scalars['String']>;
  port?: Maybe<Scalars['String']>;
};

export type UpdateAppInput = {
  name?: Maybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  apps: AppsConnection;
  deviceTunnels: DeviceTunnelsConnection;
  devices: DevicesConnection;
  generateDeviceToken: DeviceToken;
  domains: DomainsConnection;
  entryPoints: EntryPointsConnection;
  externalIps: ExternalIpsConnection;
  middlewares: MiddlewaresConnection;
  node?: Maybe<Node>;
  search: Array<Node>;
  rules: RulesConnection;
  me: User;
};

export type QueryAppsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<AppsOrderByInput>>;
  filter?: Maybe<AppsFilterInput>;
};

export type QueryDeviceTunnelsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<DeviceTunnelsOrderByInput>>;
};

export type QueryDevicesArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<DevicesOrderByInput>>;
};

export type QueryDomainsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<DomainsOrderByInput>>;
  filter?: Maybe<DomainsFilterInput>;
};

export type QueryEntryPointsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<EntryPointsOrderByInput>>;
  filter?: Maybe<EntryPointsFilterInput>;
};

export type QueryExternalIpsArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<ExternalIpsOrderByInput>>;
};

export type QueryMiddlewaresArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<MiddlewaresOrderByInput>>;
  filter?: Maybe<MiddlewaresFilterInput>;
};

export type QueryNodeArgs = {
  id: Scalars['ID'];
};

export type QuerySearchArgs = {
  query: Scalars['String'];
  typename?: Maybe<TypenameEnum>;
};

export type QueryRulesArgs = {
  first?: Maybe<Scalars['Int']>;
  last?: Maybe<Scalars['Int']>;
  after?: Maybe<Scalars['String']>;
  before?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Array<RulesOrderByInput>>;
  filter?: Maybe<RulesFilterInput>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createHttpApp: HttpApp;
  createTcpApp: TcpApp;
  createUdpApp: UdpApp;
  updateApp: App;
  deleteApp: App;
  createDevice: Device;
  updateDevice: Device;
  deleteDevice: Device;
  createDomain: Domain;
  verifyDomain: Domain;
  deleteDomain: Domain;
  createHostname: Hostname;
  createExternalPort: ExternalPort;
  createDevicePort: DevicePort;
  updateEntryPoint: EntryPoint;
  deleteEntryPoint: EntryPoint;
  createMiddleware: Middleware;
  updateMiddleware: Middleware;
  updateMiddlewaresOrder: MiddlewaresConnection;
  deleteMiddleware: Middleware;
  createRule: Rule;
  deleteRule: Rule;
  updateUser: User;
};

export type MutationCreateHttpAppArgs = {
  input: CreateHttpApp;
};

export type MutationCreateTcpAppArgs = {
  input: CreateTcpApp;
};

export type MutationCreateUdpAppArgs = {
  input: CreateUdpApp;
};

export type MutationUpdateAppArgs = {
  id: Scalars['IDGlobal'];
  input: UpdateAppInput;
};

export type MutationDeleteAppArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationCreateDeviceArgs = {
  input?: Maybe<CreateDeviceInput>;
};

export type MutationUpdateDeviceArgs = {
  id: Scalars['IDGlobal'];
  input: UpdateDeviceInput;
};

export type MutationDeleteDeviceArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationCreateDomainArgs = {
  input: CreateDomainInput;
};

export type MutationVerifyDomainArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationDeleteDomainArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationCreateHostnameArgs = {
  input: CreateHostname;
};

export type MutationCreateExternalPortArgs = {
  input?: Maybe<CreateExternalPort>;
};

export type MutationCreateDevicePortArgs = {
  input: CreateDevicePort;
};

export type MutationUpdateEntryPointArgs = {
  id: Scalars['IDGlobal'];
  input: UpdateEntryPointInput;
};

export type MutationDeleteEntryPointArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationCreateMiddlewareArgs = {
  input: CreateMiddlewareInput;
};

export type MutationUpdateMiddlewareArgs = {
  id: Scalars['IDGlobal'];
  input: UpdateMiddlewareInput;
};

export type MutationUpdateMiddlewaresOrderArgs = {
  input: UpdateMiddlewaresOrderInput;
};

export type MutationDeleteMiddlewareArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationCreateRuleArgs = {
  input: CreateRuleInput;
};

export type MutationDeleteRuleArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationUpdateUserArgs = {
  id: Scalars['IDGlobal'];
  input: UpdateUserInput;
};

export type DeviceTunnel = Node & {
  __typename?: 'DeviceTunnel';
  id: Scalars['ID'];
  clientVersion: Scalars['String'];
  ip: Scalars['String'];
  os?: Maybe<DeviceTunnelOs>;
  geo?: Maybe<DeviceTunnelGeo>;
  continent: ContinentEnum;
  region: RegionEnum;
  zone: ZoneEnum;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type DeviceTunnelOs = {
  __typename?: 'DeviceTunnelOs';
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

export type DeviceTunnelGeo = {
  __typename?: 'DeviceTunnelGeo';
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  latitude?: Maybe<Scalars['String']>;
  longitude?: Maybe<Scalars['String']>;
};

export type DeviceTunnelsConnection = {
  __typename?: 'DeviceTunnelsConnection';
  edges: Array<DeviceTunnelsEdge>;
  pageInfo: ConnectionPageInfo;
};

export type DeviceTunnelsEdge = {
  __typename?: 'DeviceTunnelsEdge';
  node: DeviceTunnel;
  cursor?: Maybe<Scalars['String']>;
};

export enum DeviceTunnelsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type DeviceTunnelsOrderByInput = {
  sort: DeviceTunnelsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export enum DeviceStatusEnum {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
}

export type Device = Node & {
  __typename?: 'Device';
  id: Scalars['ID'];
  name: Scalars['String'];
  token: Scalars['String'];
  status: DeviceStatusEnum;
  lastDeviceTunnel?: Maybe<DeviceTunnel>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type DevicesConnection = {
  __typename?: 'DevicesConnection';
  edges: Array<DevicesEdge>;
  pageInfo: ConnectionPageInfo;
};

export type DevicesEdge = {
  __typename?: 'DevicesEdge';
  node: Device;
  cursor?: Maybe<Scalars['String']>;
};

export enum DevicesOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type DevicesOrderByInput = {
  sort: DevicesOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type DeviceToken = {
  __typename?: 'DeviceToken';
  token: Scalars['String'];
};

export type CreateDeviceInput = {
  name?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
};

export type UpdateDeviceInput = {
  name?: Maybe<Scalars['String']>;
};

export enum DomainTypeEnum {
  Lotun = 'LOTUN',
  Account = 'ACCOUNT',
}

export type Domain = Node & {
  __typename?: 'Domain';
  id: Scalars['ID'];
  name: Scalars['String'];
  type: DomainTypeEnum;
  isVerified: Scalars['Boolean'];
  dnsRecords: Array<DomainDnsRecord>;
  certificate?: Maybe<DomainCertificate>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export enum DomainDnsRecordType {
  Cname = 'CNAME',
  A = 'A',
}

export type DomainDnsRecord = {
  __typename?: 'DomainDnsRecord';
  type: DomainDnsRecordType;
  name: Scalars['String'];
  value: Scalars['String'];
  isSet: Scalars['Boolean'];
};

export type DomainCertificate = {
  __typename?: 'DomainCertificate';
  commonName?: Maybe<Scalars['String']>;
  dnsNames?: Maybe<Array<Scalars['String']>>;
  isReady: Scalars['Boolean'];
  message?: Maybe<Scalars['String']>;
};

export type DomainsConnection = {
  __typename?: 'DomainsConnection';
  edges: Array<DomainsEdge>;
  pageInfo: ConnectionPageInfo;
};

export type DomainsEdge = {
  __typename?: 'DomainsEdge';
  node: Domain;
  cursor?: Maybe<Scalars['String']>;
};

export enum DomainsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type DomainsOrderByInput = {
  sort: DomainsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type DomainsFilterInput = {
  type?: Maybe<DomainTypeEnum>;
  isVerified?: Maybe<Scalars['Boolean']>;
};

export type CreateDomainInput = {
  name: Scalars['String'];
};

export type UpdateDomainInput = {
  name?: Maybe<Scalars['String']>;
};

export enum EntryPointTypeEnum {
  Hostname = 'HOSTNAME',
  ExternalPort = 'EXTERNAL_PORT',
  DevicePort = 'DEVICE_PORT',
}

export type EntryPoint = {
  id: Scalars['ID'];
  type: EntryPointTypeEnum;
  name: Scalars['String'];
  expireAt?: Maybe<Scalars['String']>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type Hostname = EntryPoint &
  Node & {
    __typename?: 'Hostname';
    id: Scalars['ID'];
    type: EntryPointTypeEnum;
    expireAt?: Maybe<Scalars['String']>;
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
    name: Scalars['String'];
    hostname: Scalars['String'];
    domain?: Maybe<Domain>;
  };

export type ExternalPort = EntryPoint &
  Node & {
    __typename?: 'ExternalPort';
    id: Scalars['ID'];
    type: EntryPointTypeEnum;
    expireAt?: Maybe<Scalars['String']>;
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
    name: Scalars['String'];
    port: Scalars['String'];
    externalIp?: Maybe<ExternalIp>;
  };

export type DevicePort = EntryPoint &
  Node & {
    __typename?: 'DevicePort';
    id: Scalars['ID'];
    type: EntryPointTypeEnum;
    expireAt?: Maybe<Scalars['String']>;
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
    name: Scalars['String'];
    port: Scalars['String'];
    device?: Maybe<Device>;
  };

export type EntryPointsConnection = {
  __typename?: 'EntryPointsConnection';
  edges: Array<EntryPointsEdge>;
  pageInfo: ConnectionPageInfo;
};

export type EntryPointsEdge = {
  __typename?: 'EntryPointsEdge';
  node: EntryPoint;
  cursor?: Maybe<Scalars['String']>;
};

export enum EntryPointsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type EntryPointsOrderByInput = {
  sort: EntryPointsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type EntryPointsFilterInput = {
  type?: Maybe<EntryPointTypeEnum>;
};

export type CreateHostname = {
  name?: Maybe<Scalars['String']>;
  subdomain?: Maybe<Scalars['String']>;
  domainId: Scalars['IDGlobal'];
};

export type CreateExternalPort = {
  name?: Maybe<Scalars['String']>;
  externalIpId?: Maybe<Scalars['IDGlobal']>;
};

export type CreateDevicePort = {
  name?: Maybe<Scalars['String']>;
  port: Scalars['String'];
  deviceId: Scalars['IDGlobal'];
};

export type UpdateEntryPointInput = {
  name?: Maybe<Scalars['String']>;
};

export type ExternalIp = Node & {
  __typename?: 'ExternalIp';
  id: Scalars['ID'];
  ipV4: Scalars['String'];
  hostname: Scalars['String'];
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type ExternalIpsConnection = {
  __typename?: 'ExternalIpsConnection';
  edges: Array<ExternalIpsEdge>;
  pageInfo: ConnectionPageInfo;
};

export type ExternalIpsEdge = {
  __typename?: 'ExternalIpsEdge';
  node: ExternalIp;
  cursor?: Maybe<Scalars['String']>;
};

export enum ExternalIpsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type ExternalIpsOrderByInput = {
  sort: ExternalIpsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type Middleware = Node & {
  __typename?: 'Middleware';
  id: Scalars['ID'];
  rule?: Maybe<Rule>;
  optionsScript: Scalars['String'];
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type MiddlewaresConnection = {
  __typename?: 'MiddlewaresConnection';
  edges: Array<MiddlewaresEdge>;
  pageInfo: ConnectionPageInfo;
};

export type MiddlewaresEdge = {
  __typename?: 'MiddlewaresEdge';
  node: Middleware;
  cursor?: Maybe<Scalars['String']>;
};

export enum MiddlewaresOrderBySortEnum {
  Priority = 'PRIORITY',
  CreatedAt = 'CREATED_AT',
}

export type MiddlewaresOrderByInput = {
  sort: MiddlewaresOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type MiddlewaresFilterInput = {
  appId?: Maybe<Scalars['IDGlobal']>;
};

export type CreateMiddlewareInput = {
  name?: Maybe<Scalars['String']>;
  optionsScript: Scalars['String'];
  appId: Scalars['IDGlobal'];
  ruleId: Scalars['IDGlobal'];
};

export type UpdateMiddlewareInput = {
  name?: Maybe<Scalars['String']>;
  optionsScript?: Maybe<Scalars['String']>;
};

export type MiddlewareIdInput = {
  id: Scalars['IDGlobal'];
};

export type UpdateMiddlewaresOrderInput = {
  appId: Scalars['IDGlobal'];
  middlewares: Array<MiddlewareIdInput>;
};

export type Node = {
  id: Scalars['ID'];
};

export enum TypenameEnum {
  App = 'APP',
  HttpApp = 'HTTP_APP',
  TcpApp = 'TCP_APP',
  UdpApp = 'UDP_APP',
  Device = 'DEVICE',
  Domain = 'DOMAIN',
  EntryPoint = 'ENTRY_POINT',
  Hostname = 'HOSTNAME',
  ExternalPort = 'EXTERNAL_PORT',
  DevicePort = 'DEVICE_PORT',
}

export type ConnectionPageInfo = {
  __typename?: 'ConnectionPageInfo';
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['String']>;
  endCursor?: Maybe<Scalars['String']>;
  edgesCount: Scalars['Int'];
  edgesTotalCount: Scalars['Int'];
  pageNumber?: Maybe<Scalars['Int']>;
  pagesCount?: Maybe<Scalars['Int']>;
};

export enum OrderByDirectionEnum {
  Asc = 'ASC',
  Desc = 'DESC',
}

export enum ContinentEnum {
  Europe = 'EUROPE',
}

export enum RegionEnum {
  EuropeWest3 = 'EUROPE_WEST3',
}

export enum ZoneEnum {
  EuropeWest3B = 'EUROPE_WEST3_B',
}

export enum RuleTypeEnum {
  Lotun = 'LOTUN',
  Account = 'ACCOUNT',
}

export type Rule = Node & {
  __typename?: 'Rule';
  id: Scalars['ID'];
  type: RuleTypeEnum;
  appTypes: Array<AppTypeEnum>;
  name: Scalars['String'];
  description: Scalars['String'];
  version: Scalars['String'];
  isLatest: Scalars['Boolean'];
  ruleScript: Scalars['String'];
  exampleOptionsScript: Scalars['String'];
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type RulesConnection = {
  __typename?: 'RulesConnection';
  edges: Array<RulesEdge>;
  pageInfo: ConnectionPageInfo;
};

export type RulesEdge = {
  __typename?: 'RulesEdge';
  node: Rule;
  cursor?: Maybe<Scalars['String']>;
};

export enum RulesOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type RulesOrderByInput = {
  sort: RulesOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export type RulesFilterInput = {
  type?: Maybe<RuleTypeEnum>;
  appType?: Maybe<AppTypeEnum>;
  isLatest?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
};

export type CreateRuleInput = {
  name: Scalars['String'];
  version: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  appTypes: Array<AppTypeEnum>;
  ruleScript: Scalars['String'];
  exampleOptionsScript: Scalars['String'];
};

export type UpdateRuleInput = {
  name?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  ruleScript?: Maybe<Scalars['String']>;
  exampleOptionsScript?: Maybe<Scalars['String']>;
};

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

export type UpdateUserInput = {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
};

export type GenerateDeviceTokenQueryVariables = {};

export type GenerateDeviceTokenQuery = { __typename?: 'Query' } & {
  generateDeviceToken: { __typename?: 'DeviceToken' } & Pick<
    DeviceToken,
    'token'
  >;
};

export const GenerateDeviceTokenDocument = gql`
  query generateDeviceToken {
    generateDeviceToken {
      token
    }
  }
`;

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (sdkFunction) => sdkFunction();
export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    generateDeviceToken(
      variables?: GenerateDeviceTokenQueryVariables,
    ): Promise<GenerateDeviceTokenQuery> {
      return withWrapper(() =>
        client.request<GenerateDeviceTokenQuery>(
          print(GenerateDeviceTokenDocument),
          variables,
        ),
      );
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
