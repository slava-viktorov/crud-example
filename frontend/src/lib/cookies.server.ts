'use server';

import { cookies } from 'next/headers';

import parseSetCookieString, { ResponseCookie, RequestCookie } from './setCookieParser';

const REFRESH_TOKEN = process.env.REFRESH_TOKEN!;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN!;

const getCookieStore = async () => await cookies();

export async function getAccessTokenCookie(): Promise<string | null> {
  const cookieStore = await getCookieStore();
  return cookieStore.get(ACCESS_TOKEN)?.value || null;
}

export async function getRefreshTokenCookie(): Promise<string | null> {
  const cookieStore = await getCookieStore();
  return cookieStore.get(REFRESH_TOKEN)?.value || null;
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await getCookieStore();
  cookieStore.delete(ACCESS_TOKEN);
  cookieStore.delete(REFRESH_TOKEN);
}

export async function getCookies(): Promise<RequestCookie[]> {
  const cookieStore = await getCookieStore();
  return cookieStore.getAll();
}

function cookiesToString(cookies: RequestCookie[]): string {
  const cookiesString = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
  return cookiesString;
}

export async function getAllRequestCookiesToString(): Promise<string> {
  const cookies = await getCookies();
  const cookiesString = cookiesToString(cookies);
  return cookiesString;
}

export async function setCookies(responseCookies: ResponseCookie[]): Promise<void> {
  const cookieStore = await getCookieStore();
  
  for (const cookie of responseCookies) {
    const {
      name,
      value,
      options,
    } = cookie;

    cookieStore.set(name, value, options);
  }
}

export async function setCookiesFromSetCookieString(setCookieString: [string] | string): Promise<void> {
  const responseCookies = parseSetCookieString(setCookieString);
  await setCookies(responseCookies);
}