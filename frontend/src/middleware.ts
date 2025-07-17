import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import parseSetCookieString from '@/lib/setCookieParser';

export async function middleware(request: NextRequest) {
  const responseNext = NextResponse.next();
  
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if ((!accessToken && !refreshToken) || !refreshToken) return responseNext;

  if (accessToken) {
    try {
      const res = await fetch(process.env.API_URL + '/auth/validate-token', {
        method: 'HEAD',
        headers: {
          Cookie: `accessToken=${accessToken}`,
        },
      });
      if (res.ok) return responseNext;
    } catch {}
  }

  let res = null;
  try {
    res = await fetch(process.env.API_URL + '/auth/refresh', {
      method: 'POST',
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
    });

    if (!res.ok) {
      responseNext.cookies.delete('accessToken');
      responseNext.cookies.delete('refreshToken');

      return responseNext;
    }
  } catch {
    return responseNext;
  }

  
  const setCookies = res.headers.get('set-cookie');
  if (!setCookies) return responseNext;

  const responseSetCookies = setCookies.split(',');
  const cookies = parseSetCookieString(responseSetCookies);
  cookies.forEach((cookie) => {
    responseNext.cookies.set(cookie.name, cookie.value, cookie.options);
  });

  return responseNext;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};