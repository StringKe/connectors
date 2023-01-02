/**
 * The Implementation of OpenID Connect of WeChat Web Open Platform.
 * https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
 */

import type {
  CreateConnector,
  GetAuthorizationUri,
  GetConnectorConfig,
  GetUserInfo,
  SocialConnector,
} from '@logto/connector-kit';
import {
  ConnectorError,
  ConnectorErrorCodes,
  ConnectorType,
  validateConfig,
} from '@logto/connector-kit';
import { got } from 'got';

import { getAccessToken, tryGot } from './access-token.js';
import { defaultMetadata, wecomEndpoint } from './constant.js';
import type { WeComConfig, WeComQrConnectParameters } from './types.js';
import {
  wecomBaseParameters,
  wecomConfigGuard,
  wecomErrorResponse,
  wecomQrConnectParameters,
  wecomQrConnectUserDetailResponse,
} from './types.js';

function isWeWork(userAgent?: string) {
  // https://developer.work.weixin.qq.com/document/path/90315#%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E7%9A%84ua
  return userAgent?.toLowerCase().includes('wxwork');
}

function isWeWorkParameters(data: unknown): data is WeComQrConnectParameters {
  const result = wecomQrConnectParameters.safeParse(data);

  return result.success;
}

function throwErrorResponseBody(body: unknown) {
  const result = wecomErrorResponse.safeParse(body);

  if (result.success) {
    throw new ConnectorError(
      ConnectorErrorCodes.General,
      `${result.data.errcode}: ${result.data.errmsg}`
    );
  }
}

async function getUserTicket(code: string, appId: string, appSecret: string) {
  const accessToken = await getAccessToken(appId, appSecret);
  const response = await tryGot(
    () => {
      return got.get<unknown>(wecomEndpoint.base.userToken, {
        searchParams: {
          access_token: accessToken.access_token,
          code,
        },
      });
    },
    appId,
    appSecret
  );
}

const getAuthorizationUri =
  (getConfig: GetConnectorConfig): GetAuthorizationUri =>
  async ({ state, redirectUri, headers }) => {
    const config = await getConfig(defaultMetadata.id);
    validateConfig<WeComConfig>(config, wecomConfigGuard);

    const { appId, scope = 'snsapi_base' } = config;

    if (isWeWork(headers?.userAgent)) {
      const queryParameters = new URLSearchParams({
        appid: appId,
        redirect_uri: encodeURI(redirectUri), // The variable `redirectUri` should match {appId, appSecret}
        response_type: 'code',
        scope,
        state,
      });

      return `${wecomEndpoint.base.authorization}?${queryParameters.toString()}#wechat_redirect`;
    }

    const queryParameters = new URLSearchParams({
      appid: appId,
      redirect_uri: encodeURI(redirectUri), // The variable `redirectUri` should match {appId, appSecret}
      state,
      usertype: 'member',
    });

    return `${wecomEndpoint.qrConnect.authorization}?${queryParameters.toString()}`;
  };

const getUserInfo =
  (getConfig: GetConnectorConfig): GetUserInfo =>
  async (data) => {
    const config = await getConfig(defaultMetadata.id);
    validateConfig<WeComConfig>(config, wecomConfigGuard);

    const { appId, appSecret } = config;

    const isWeWork = isWeWorkParameters(data);

    if (isWeWork) {
      const { auth_code } = data;
      const accessToken = await getAccessToken(appId, appSecret);

      const response = await tryGot(
        () => {
          return got.get<unknown>(wecomEndpoint.qrConnect.userDetail, {
            searchParams: {
              access_token: accessToken.access_token,
              auth_code,
            },
          });
        },
        appId,
        appSecret
      );

      const result = wecomQrConnectUserDetailResponse.safeParse(response.body);

      if (result.success) {
        const { userinfo } = result.data;

        return {
          id: userinfo.open_userid,
          userId: userinfo.userid,
          name: userinfo.name,
          avatar: userinfo.avatar,
        };
      }

      throwErrorResponseBody(response.body);
    }
    const result = wecomBaseParameters.safeParse(data);

    if (result.success) {
      const { code } = result.data;
    }

    throw new ConnectorError(ConnectorErrorCodes.General, 'Invalid parameters for WeCom connector');
  };

const createWechatConnector: CreateConnector<SocialConnector> = async ({ getConfig }) => {
  return {
    metadata: defaultMetadata,
    type: ConnectorType.Social,
    configGuard: wecomConfigGuard,
    getAuthorizationUri: getAuthorizationUri(getConfig),
    getUserInfo: getUserInfo(getConfig),
  };
};

export default createWechatConnector;
