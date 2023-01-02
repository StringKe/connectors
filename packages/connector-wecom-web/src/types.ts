import { z } from 'zod';

export const wecomConfigGuard = z.object({
  appId: z.string(),
  appSecret: z.string(),
  scope: z.enum(['snsapi_base', 'snsapi_userinfo']).optional(),
});

export type WeComConfig = z.infer<typeof wecomConfigGuard>;

export const wecomQrConnectParameters = z.object({
  auth_code: z.string(),
});

export type WeComQrConnectParameters = z.infer<typeof wecomQrConnectParameters>;

export const wecomBaseParameters = z.object({
  code: z.string(),
});

export const wecomErrorResponse = z.object({
  errcode: z.number().refine((value) => value !== 0),
  errmsg: z.string().refine((value) => value !== 'ok'),
});

export const wecomQrConnectUserDetailResponse = z.object({
  errcode: z
    .number()
    .optional()
    .refine((value) => value === 0),
  errmsg: z
    .string()
    .optional()
    .refine((value) => value === 'ok'),
  usertype: z.number(),
  userinfo: z.object({
    userid: z.string(),
    open_userid: z.string(),
    name: z.string().optional(),
    avatar: z.string().optional(),
  }),
});

export const wecomBaseUserTicketResponse = z.object({
  errcode: z
    .number()
    .optional()
    .refine((value) => value === 0),
  errmsg: z
    .string()
    .optional()
    .refine((value) => value === 'ok'),
  userid: z.string(),
  user_ticket: z.string(),
});

export const wecomBaseUserExternalTicketResponse = z.object({
  errcode: z
    .number()
    .optional()
    .refine((value) => value === 0),
  errmsg: z
    .string()
    .optional()
    .refine((value) => value === 'ok'),
  external_userid: z.string(),
  openid: z.string(),
});
