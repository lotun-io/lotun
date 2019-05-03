import { ClientError } from './wsStream/WsStream';

export const errorCodes = {
  DEVICE_TOKEN_UNPAIRED: <ClientError>'DEVICE_TOKEN_UNPAIRED',
  DEVICE_TOKEN_INVALID: <ClientError>'DEVICE_TOKEN_INVALID',
  CONNECTION_ERROR: <ClientError>'CONNECTION_ERROR',
  INTERNAL_SERVER_ERROR: <ClientError>'INTERNAL_SERVER_ERROR',
  CLIENT_INFO_INVALID: <ClientError>'CLIENT_INFO_INVALID',
};
