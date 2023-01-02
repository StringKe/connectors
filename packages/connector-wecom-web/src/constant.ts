import type { ConnectorMetadata } from '@logto/connector-kit';
import { ConnectorPlatform } from '@logto/connector-kit';

export const wecomEndpoint = {
  accessToken: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
  base: {
    authorization: 'https://open.weixin.qq.com/connect/oauth2/authorize',
    userToken: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
    userDetail: 'https://qyapi.weixin.qq.com/cgi-bin/auth/getuserdetail',
  },
  qrConnect: {
    authorization: 'https://open.work.weixin.qq.com/wwopen/sso/3rd_qrConnect',
    userDetail: 'https://qyapi.weixin.qq.com/cgi-bin/service/get_login_info',
  },
};

export const defaultMetadata: ConnectorMetadata = {
  id: 'wecom-web',
  target: 'wecom',
  platform: ConnectorPlatform.Web,
  name: {
    en: 'WeCom',
    'zh-CN': '企业微信',
    'tr-TR': 'WeCom',
    ko: 'WeCom',
  },
  logo: './logo.svg',
  logoDark: null,
  description: {
    en: 'WeCom is a cross-platform instant messaging app.',
    'zh-CN': '微信是一款跨平台的即时通讯软件。',
  },
  readme: './README.md',
  configTemplate: './docs/config-template.json',
};

export const defaultTimeout = 5000;
