import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    // Вызываем logout на backend (refreshToken в cookie)
    await axios.post(
      process.env.API_URL + '/auth/logout',
      {},
      {
        headers: { Cookie: req.headers.get('cookie') || '' },
        withCredentials: true,
      }
    );
  } catch {}
  // Удаляем accessToken cookie на клиенте
  const res = NextResponse.redirect(new URL('/login', req.url));
  res.cookies.set('accessToken', '', { maxAge: 0 });
  res.cookies.set('refreshToken', '', { maxAge: 0 });
  return res;
} 