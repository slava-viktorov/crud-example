import setCookieParser from 'set-cookie-parser';

export interface RequestCookie {
  name: string;
  value: string;
}

export interface ResponseCookie extends RequestCookie {
  options: ResponseCookieOptions;
}

export interface ResponseCookieOptions {
  path?: string;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
}

export default function parseSetCookieString(setCookieString: string[] | string): ResponseCookie[] {
  const setCookies = setCookieParser(setCookieString);
  const responseCookies: ResponseCookie[] = [];

  for (const cookie of setCookies) {
    const {
      name,
      value,
      path,
      expires,
      maxAge,
      domain,
      secure,
      httpOnly,
      sameSite,
    } = cookie;

    const options: ResponseCookieOptions = {};
    
    if (path) options.path = path;
    if (expires) options.expires = expires;
    if (maxAge) options.maxAge = maxAge;
    if (domain) options.domain = domain;
    if (secure !== undefined) options.secure = secure;
    if (httpOnly !== undefined) options.httpOnly = httpOnly;
    if (sameSite) options.sameSite = sameSite as 'lax' | 'strict' | 'none';

    responseCookies.push({ name, value, options });
  }

  return responseCookies;
}