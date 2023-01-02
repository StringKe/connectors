import { ConnectorError, ConnectorErrorCodes } from '@logto/connector-kit';
import type { CancelableRequest, Response } from 'got';
import { got } from 'got';
import { z } from 'zod';

import { wecomEndpoint } from './constant.js';

const accessTokenResponse = z.object({
  errcode: z.number().refine((value) => value === 0),
  errmsg: z.string().refine((value) => value === 'ok'),
  access_token: z.string(),
  expires_in: z.number(),
});

export type AccessTokenData = {
  access_token: string;
  expires_in: number;
  signature_timestamp: number;
};
export const accessTokenData = new Map<string, AccessTokenData>();

export async function checkIsExpired(data: AccessTokenData) {
  const now = Date.now();
  const expiresAt = data.signature_timestamp + data.expires_in * 1000;

  return now > expiresAt;
}

export async function getAccessTokenFromServer(
  appId: string,
  appSecret: string
): Promise<AccessTokenData> {
  const timestamp = Date.now() - 2000;
  const response = got.get(wecomEndpoint.accessToken, {
    searchParams: {
      corpid: appId,
      corpsecret: appSecret,
    },
  });

  const result = accessTokenResponse.safeParse(response);

  if (!result.success) {
    throw new ConnectorError(
      ConnectorErrorCodes.General,
      `Failed to get access token from WeCom server: ${result.error.message}`
    );
  }

  const { data } = result;

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    signature_timestamp: timestamp,
  };
}

export async function getAccessToken(appId: string, appSecret: string) {
  const savedData = accessTokenData.get(appId);

  if (savedData) {
    const isExpired = await checkIsExpired(savedData);

    if (!isExpired) {
      return savedData;
    }
  }

  const newAccessTokenData = await getAccessTokenFromServer(appId, appSecret);
  accessTokenData.set(appId, newAccessTokenData);

  return newAccessTokenData;
}

export function removeAccessToken(appId: string) {
  accessTokenData.delete(appId);
}

export async function tryGot(
  functionGot: () => CancelableRequest<Response>,
  appId: string,
  appSecret: string
) {
  try {
    return await functionGot();
  } catch (error: unknown) {
    if (error instanceof ConnectorError) {
      throw error;
    }

    if (error instanceof Error && error.message.includes('42001')) {
      removeAccessToken(appId);
      await getAccessToken(appId, appSecret);

      return functionGot();
    }

    throw new ConnectorError(ConnectorErrorCodes.General, error);
  }
}
