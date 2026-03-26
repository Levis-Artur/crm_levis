import { NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './constants';
import type { AuthTokensPayload } from './types';
import { durationToSeconds } from './token';

function getCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

export function applyAuthCookies(response: NextResponse, payload: AuthTokensPayload) {
  const accessMaxAge = durationToSeconds(payload.accessTokenExpiresIn);
  const refreshMaxAge = durationToSeconds(payload.refreshTokenExpiresIn);

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    payload.accessToken,
    getCookieOptions(accessMaxAge),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    payload.refreshToken,
    getCookieOptions(refreshMaxAge),
  );

  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, '', getCookieOptions(0));
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', getCookieOptions(0));
  return response;
}
