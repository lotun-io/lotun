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
  IDGlobal: any;
};

export type Account = Node & {
  __typename?: 'Account';
  id: Scalars['ID'];
  name: Scalars['String'];
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type App = {
  id: Scalars['ID'];
  type: AppTypeEnum;
  name: Scalars['String'];
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
  entryPoint?: Maybe<EntryPoint>;
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

export type AppsError = {
  __typename?: 'AppsError';
  first?: Maybe<AppsErrorFirst>;
  last?: Maybe<AppsErrorLast>;
  Connection?: Maybe<DefaultConstraint>;
};

export type AppsErrorFirst = {
  __typename?: 'AppsErrorFirst';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type AppsErrorLast = {
  __typename?: 'AppsErrorLast';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type AppsFilterInput = {
  entryPointId?: Maybe<Scalars['IDGlobal']>;
  type?: Maybe<AppTypeEnum>;
};

export type AppsOrderByInput = {
  sort: AppsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export enum AppsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export enum AppTypeEnum {
  Http = 'HTTP',
  Tcp = 'TCP',
  Udp = 'UDP',
}

export type AuthConfig = {
  __typename?: 'AuthConfig';
  authorizeUrl: Scalars['String'];
  responseType: Scalars['String'];
  audience: Scalars['String'];
  scope: Scalars['String'];
  clientId: Scalars['String'];
  redirectUri: Scalars['String'];
};

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

export enum ContinentEnum {
  Europe = 'EUROPE',
}

export type CreateDeviceInput = {
  name?: Maybe<Scalars['String']>;
  token?: Maybe<Scalars['String']>;
};

export type CreateDevicePort = {
  name?: Maybe<Scalars['String']>;
  port: Scalars['String'];
  deviceId: Scalars['IDGlobal'];
};

export type CreateDevicePortError = {
  __typename?: 'CreateDevicePortError';
  input?: Maybe<CreateDevicePortErrorInput>;
};

export type CreateDevicePortErrorInput = {
  __typename?: 'CreateDevicePortErrorInput';
  deviceId?: Maybe<CreateDevicePortErrorInputDeviceId>;
};

export type CreateDevicePortErrorInputDeviceId = {
  __typename?: 'CreateDevicePortErrorInputDeviceId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateDomainInput = {
  name: Scalars['String'];
};

export type CreateExternalPort = {
  name?: Maybe<Scalars['String']>;
  externalIpId?: Maybe<Scalars['IDGlobal']>;
};

export type CreateExternalPortError = {
  __typename?: 'CreateExternalPortError';
  input?: Maybe<CreateExternalPortErrorInput>;
};

export type CreateExternalPortErrorInput = {
  __typename?: 'CreateExternalPortErrorInput';
  externalIpId?: Maybe<CreateExternalPortErrorInputExternalIpId>;
};

export type CreateExternalPortErrorInputExternalIpId = {
  __typename?: 'CreateExternalPortErrorInputExternalIpId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateHostname = {
  name?: Maybe<Scalars['String']>;
  subdomain?: Maybe<Scalars['String']>;
  domainId: Scalars['IDGlobal'];
};

export type CreateHostnameError = {
  __typename?: 'CreateHostnameError';
  input?: Maybe<CreateHostnameErrorInput>;
};

export type CreateHostnameErrorInput = {
  __typename?: 'CreateHostnameErrorInput';
  subdomain?: Maybe<CreateHostnameErrorInputSubdomain>;
  domainId?: Maybe<CreateHostnameErrorInputDomainId>;
};

export type CreateHostnameErrorInputDomainId = {
  __typename?: 'CreateHostnameErrorInputDomainId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateHostnameErrorInputSubdomain = {
  __typename?: 'CreateHostnameErrorInputSubdomain';
  Matches?: Maybe<DefaultConstraint>;
};

export type CreateHttpApp = {
  name?: Maybe<Scalars['String']>;
  entryPath?: Maybe<Scalars['String']>;
  entryPointId: Scalars['IDGlobal'];
  forwardPoint: HttpForwardPointInput;
};

export type CreateHttpAppError = {
  __typename?: 'CreateHttpAppError';
  input?: Maybe<CreateHttpAppErrorInput>;
};

export type CreateHttpAppErrorInput = {
  __typename?: 'CreateHttpAppErrorInput';
  forwardPoint?: Maybe<CreateHttpAppErrorInputForwardPoint>;
  entryPointId?: Maybe<CreateHttpAppErrorInputEntryPointId>;
};

export type CreateHttpAppErrorInputEntryPointId = {
  __typename?: 'CreateHttpAppErrorInputEntryPointId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateHttpAppErrorInputForwardPoint = {
  __typename?: 'CreateHttpAppErrorInputForwardPoint';
  deviceId?: Maybe<CreateHttpAppErrorInputForwardPointDeviceId>;
};

export type CreateHttpAppErrorInputForwardPointDeviceId = {
  __typename?: 'CreateHttpAppErrorInputForwardPointDeviceId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateTcpApp = {
  name?: Maybe<Scalars['String']>;
  entryPointId: Scalars['IDGlobal'];
  forwardPoint: TcpForwardPointInput;
};

export type CreateTcpAppError = {
  __typename?: 'CreateTcpAppError';
  input?: Maybe<CreateTcpAppErrorInput>;
};

export type CreateTcpAppErrorInput = {
  __typename?: 'CreateTcpAppErrorInput';
  forwardPoint?: Maybe<CreateTcpAppErrorInputForwardPoint>;
  entryPointId?: Maybe<CreateTcpAppErrorInputEntryPointId>;
};

export type CreateTcpAppErrorInputEntryPointId = {
  __typename?: 'CreateTcpAppErrorInputEntryPointId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateTcpAppErrorInputForwardPoint = {
  __typename?: 'CreateTcpAppErrorInputForwardPoint';
  deviceId?: Maybe<CreateTcpAppErrorInputForwardPointDeviceId>;
};

export type CreateTcpAppErrorInputForwardPointDeviceId = {
  __typename?: 'CreateTcpAppErrorInputForwardPointDeviceId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateUdpApp = {
  name?: Maybe<Scalars['String']>;
  entryPointId: Scalars['IDGlobal'];
  forwardPoint: UdpForwardPointInput;
};

export type CreateUdpAppError = {
  __typename?: 'CreateUdpAppError';
  input?: Maybe<CreateUdpAppErrorInput>;
};

export type CreateUdpAppErrorInput = {
  __typename?: 'CreateUdpAppErrorInput';
  forwardPoint?: Maybe<CreateUdpAppErrorInputForwardPoint>;
  entryPointId?: Maybe<CreateUdpAppErrorInputEntryPointId>;
};

export type CreateUdpAppErrorInputEntryPointId = {
  __typename?: 'CreateUdpAppErrorInputEntryPointId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type CreateUdpAppErrorInputForwardPoint = {
  __typename?: 'CreateUdpAppErrorInputForwardPoint';
  deviceId?: Maybe<CreateUdpAppErrorInputForwardPointDeviceId>;
};

export type CreateUdpAppErrorInputForwardPointDeviceId = {
  __typename?: 'CreateUdpAppErrorInputForwardPointDeviceId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type DefaultConstraint = {
  __typename?: 'DefaultConstraint';
  message: Scalars['String'];
};

export type DeleteAppError = {
  __typename?: 'DeleteAppError';
  id?: Maybe<DeleteAppErrorId>;
};

export type DeleteAppErrorId = {
  __typename?: 'DeleteAppErrorId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type DeleteDeviceError = {
  __typename?: 'DeleteDeviceError';
  id?: Maybe<DeleteDeviceErrorId>;
};

export type DeleteDeviceErrorId = {
  __typename?: 'DeleteDeviceErrorId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type DeleteDomainError = {
  __typename?: 'DeleteDomainError';
  id?: Maybe<DeleteDomainErrorId>;
};

export type DeleteDomainErrorId = {
  __typename?: 'DeleteDomainErrorId';
  NotFound?: Maybe<DefaultConstraint>;
  Forbidden?: Maybe<DefaultConstraint>;
};

export type DeleteEntryPointError = {
  __typename?: 'DeleteEntryPointError';
  id?: Maybe<DeleteEntryPointErrorId>;
};

export type DeleteEntryPointErrorId = {
  __typename?: 'DeleteEntryPointErrorId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type Device = Node & {
  __typename?: 'Device';
  id: Scalars['ID'];
  name: Scalars['String'];
  token: Scalars['String'];
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
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

export type DevicesError = {
  __typename?: 'DevicesError';
  first?: Maybe<DevicesErrorFirst>;
  last?: Maybe<DevicesErrorLast>;
  Connection?: Maybe<DefaultConstraint>;
};

export type DevicesErrorFirst = {
  __typename?: 'DevicesErrorFirst';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type DevicesErrorLast = {
  __typename?: 'DevicesErrorLast';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type DevicesOrderByInput = {
  sort: DevicesOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export enum DevicesOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export type DeviceToken = {
  __typename?: 'DeviceToken';
  token: Scalars['String'];
};

export type DeviceTunnel = Node & {
  __typename?: 'DeviceTunnel';
  id: Scalars['ID'];
  version: Scalars['String'];
  ip: Scalars['String'];
  os: DeviceTunnelOs;
  geo: DeviceTunnelGeo;
  continent: ContinentEnum;
  region: RegionEnum;
  zone: ZoneEnum;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
};

export type DeviceTunnelGeo = {
  __typename?: 'DeviceTunnelGeo';
  country?: Maybe<Scalars['String']>;
  region?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  latitude?: Maybe<Scalars['String']>;
  longitude?: Maybe<Scalars['String']>;
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
  serial?: Maybe<Scalars['String']>;
  build?: Maybe<Scalars['String']>;
};

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

export type DomainCertificate = {
  __typename?: 'DomainCertificate';
  commonName?: Maybe<Scalars['String']>;
  dnsNames?: Maybe<Array<Scalars['String']>>;
  isReady: Scalars['Boolean'];
  message?: Maybe<Scalars['String']>;
};

export type DomainDnsRecord = {
  __typename?: 'DomainDnsRecord';
  type: DomainDnsRecordType;
  name: Scalars['String'];
  value: Scalars['String'];
  isSet: Scalars['Boolean'];
};

export enum DomainDnsRecordType {
  Cname = 'CNAME',
  A = 'A',
}

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

export type DomainsError = {
  __typename?: 'DomainsError';
  first?: Maybe<DomainsErrorFirst>;
  last?: Maybe<DomainsErrorLast>;
  Connection?: Maybe<DefaultConstraint>;
};

export type DomainsErrorFirst = {
  __typename?: 'DomainsErrorFirst';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type DomainsErrorLast = {
  __typename?: 'DomainsErrorLast';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type DomainsFilterInput = {
  type?: Maybe<DomainTypeEnum>;
};

export type DomainsOrderByInput = {
  sort: DomainsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export enum DomainsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export enum DomainTypeEnum {
  Lotun = 'LOTUN',
  Account = 'ACCOUNT',
}

export type EntryPoint = {
  id: Scalars['ID'];
  type: EntryPointTypeEnum;
  name: Scalars['String'];
  expireAt?: Maybe<Scalars['String']>;
  updatedAt: Scalars['String'];
  createdAt: Scalars['String'];
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

export type EntryPointsError = {
  __typename?: 'EntryPointsError';
  first?: Maybe<EntryPointsErrorFirst>;
  last?: Maybe<EntryPointsErrorLast>;
  Connection?: Maybe<DefaultConstraint>;
};

export type EntryPointsErrorFirst = {
  __typename?: 'EntryPointsErrorFirst';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type EntryPointsErrorLast = {
  __typename?: 'EntryPointsErrorLast';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type EntryPointsFilterInput = {
  type?: Maybe<EntryPointTypeEnum>;
};

export type EntryPointsOrderByInput = {
  sort: EntryPointsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export enum EntryPointsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

export enum EntryPointTypeEnum {
  Hostname = 'HOSTNAME',
  ExternalPort = 'EXTERNAL_PORT',
  DevicePort = 'DEVICE_PORT',
}

export type Error =
  | AppsError
  | CreateHttpAppError
  | CreateTcpAppError
  | CreateUdpAppError
  | DeleteAppError
  | DevicesError
  | UpdateDeviceError
  | DeleteDeviceError
  | DomainsError
  | VerifyDomainError
  | DeleteDomainError
  | EntryPointsError
  | CreateHostnameError
  | CreateExternalPortError
  | CreateDevicePortError
  | DeleteEntryPointError
  | ExternalIpsError
  | UpdateUserError;

export type ExternalIp = Node & {
  __typename?: 'ExternalIp';
  id: Scalars['ID'];
  ipV4: Scalars['String'];
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

export type ExternalIpsError = {
  __typename?: 'ExternalIpsError';
  first?: Maybe<ExternalIpsErrorFirst>;
  last?: Maybe<ExternalIpsErrorLast>;
  Connection?: Maybe<DefaultConstraint>;
};

export type ExternalIpsErrorFirst = {
  __typename?: 'ExternalIpsErrorFirst';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type ExternalIpsErrorLast = {
  __typename?: 'ExternalIpsErrorLast';
  Max?: Maybe<DefaultConstraint>;
  Min?: Maybe<DefaultConstraint>;
};

export type ExternalIpsOrderByInput = {
  sort: ExternalIpsOrderBySortEnum;
  direction: OrderByDirectionEnum;
};

export enum ExternalIpsOrderBySortEnum {
  CreatedAt = 'CREATED_AT',
}

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

export type HttpApp = App &
  Node & {
    __typename?: 'HttpApp';
    id: Scalars['ID'];
    type: AppTypeEnum;
    name: Scalars['String'];
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
    entryPath: Scalars['String'];
    entryPoint?: Maybe<EntryPoint>;
    forwardPoint?: Maybe<HttpForwardPoint>;
    options?: Maybe<HttpAppOptions>;
  };

export type HttpAppOptions = {
  __typename?: 'HttpAppOptions';
  forceHttps: Scalars['Boolean'];
};

export type HttpAppOptionsInput = {
  forceHttps?: Maybe<Scalars['Boolean']>;
};

export type HttpForwardPoint = {
  __typename?: 'HttpForwardPoint';
  device?: Maybe<Device>;
  host: Scalars['String'];
  port: Scalars['String'];
};

export type HttpForwardPointInput = {
  deviceId: Scalars['IDGlobal'];
  port: Scalars['String'];
  host?: Maybe<Scalars['String']>;
};

export enum HttpForwardPointTypeEnum {
  Tcp = 'TCP',
  Tls = 'TLS',
}

export type Mutation = {
  __typename?: 'Mutation';
  createHttpApp: HttpApp;
  createTcpApp: TcpApp;
  createUdpApp: UdpApp;
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
  deleteEntryPoint: EntryPoint;
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

export type MutationDeleteEntryPointArgs = {
  id: Scalars['IDGlobal'];
};

export type MutationUpdateUserArgs = {
  id: Scalars['IDGlobal'];
  input: UpdateUserInput;
};

export type Node = {
  id: Scalars['ID'];
};

export enum OrderByDirectionEnum {
  Asc = 'ASC',
  Desc = 'DESC',
}

export type Query = {
  __typename?: 'Query';
  apps: AppsConnection;
  devices: DevicesConnection;
  generateDeviceToken: DeviceToken;
  domains: DomainsConnection;
  entryPoints: EntryPointsConnection;
  error?: Maybe<Error>;
  externalIps: ExternalIpsConnection;
  node?: Maybe<Node>;
  search: Array<Node>;
  authConfig: AuthConfig;
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

export type QueryNodeArgs = {
  id: Scalars['ID'];
};

export type QuerySearchArgs = {
  query: Scalars['String'];
  typename?: Maybe<TypenameEnum>;
};

export type QueryAuthConfigArgs = {
  redirectUri?: Maybe<Scalars['String']>;
};

export enum RegionEnum {
  EuropeWest3 = 'EUROPE_WEST3',
}

export type TcpApp = App &
  Node & {
    __typename?: 'TcpApp';
    id: Scalars['ID'];
    type: AppTypeEnum;
    name: Scalars['String'];
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
    entryPoint?: Maybe<EntryPoint>;
    forwardPoint?: Maybe<TcpForwardPoint>;
  };

export type TcpForwardPoint = {
  __typename?: 'TcpForwardPoint';
  device?: Maybe<Device>;
  host: Scalars['String'];
  port: Scalars['String'];
};

export type TcpForwardPointInput = {
  deviceId: Scalars['IDGlobal'];
  port: Scalars['String'];
  host?: Maybe<Scalars['String']>;
};

export enum TcpForwardPointTypeEnum {
  Tcp = 'TCP',
  Tls = 'TLS',
}

export type TlsOptions = {
  __typename?: 'TlsOptions';
  rejectUnauhtorized: Scalars['Boolean'];
};

export type TlsOptionsInput = {
  rejectUnauhtorized?: Maybe<Scalars['Boolean']>;
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

export type UdpApp = App &
  Node & {
    __typename?: 'UdpApp';
    id: Scalars['ID'];
    type: AppTypeEnum;
    name: Scalars['String'];
    updatedAt: Scalars['String'];
    createdAt: Scalars['String'];
    entryPoint?: Maybe<EntryPoint>;
    forwardPoint?: Maybe<UdpForwardPoint>;
  };

export type UdpForwardPoint = {
  __typename?: 'UdpForwardPoint';
  device?: Maybe<Device>;
  host: Scalars['String'];
  port: Scalars['String'];
};

export type UdpForwardPointInput = {
  deviceId: Scalars['IDGlobal'];
  port: Scalars['String'];
  host?: Maybe<Scalars['String']>;
};

export type UpdateDeviceError = {
  __typename?: 'UpdateDeviceError';
  id?: Maybe<UpdateDeviceErrorId>;
};

export type UpdateDeviceErrorId = {
  __typename?: 'UpdateDeviceErrorId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type UpdateDeviceInput = {
  name?: Maybe<Scalars['String']>;
};

export type UpdateDomainInput = {
  name?: Maybe<Scalars['String']>;
};

export type UpdateUserError = {
  __typename?: 'UpdateUserError';
  id?: Maybe<UpdateUserErrorId>;
};

export type UpdateUserErrorId = {
  __typename?: 'UpdateUserErrorId';
  NotFound?: Maybe<DefaultConstraint>;
};

export type UpdateUserInput = {
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
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

export type VerifyDomainError = {
  __typename?: 'VerifyDomainError';
  id?: Maybe<VerifyDomainErrorId>;
};

export type VerifyDomainErrorId = {
  __typename?: 'VerifyDomainErrorId';
  NotFound?: Maybe<DefaultConstraint>;
  Forbidden?: Maybe<DefaultConstraint>;
};

export enum ZoneEnum {
  EuropeWest3B = 'EUROPE_WEST3_B',
}

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
export function getSdk(client: GraphQLClient) {
  return {
    generateDeviceToken(
      variables?: GenerateDeviceTokenQueryVariables,
    ): Promise<GenerateDeviceTokenQuery> {
      return client.request<GenerateDeviceTokenQuery>(
        print(GenerateDeviceTokenDocument),
        variables,
      );
    },
  };
}
