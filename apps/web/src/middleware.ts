import { NextResponse, type NextRequest } from 'next/server';
import { refreshWithBackend } from './lib/auth/backend';
import { clearAuthCookies, applyAuthCookies } from './lib/auth/cookies';
import {
  ACCESS_TOKEN_COOKIE,
  PUBLIC_ONLY_PATHS,
  PROTECTED_PATH_PREFIXES,
  REFRESH_TOKEN_COOKIE,
} from './lib/auth/constants';
import { isJwtExpired } from './lib/auth/token';

function matchesPath(pathname: string, patterns: readonly string[]) {
  return patterns.some((pattern) => pathname === pattern || pathname.startsWith(`${pattern}/`));
}

async function refreshSession(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return null;
  }

  const refreshed = await refreshWithBackend(refreshToken);

  if (!refreshed) {
    return null;
  }

  return refreshed;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  const accessTokenIsValid = accessToken ? !isJwtExpired(accessToken) : false;
  const isProtectedPath = matchesPath(pathname, PROTECTED_PATH_PREFIXES);
  const isPublicOnlyPath = matchesPath(pathname, PUBLIC_ONLY_PATHS);

  if (isProtectedPath) {
    if (accessTokenIsValid) {
      return NextResponse.next();
    }

    if (refreshToken) {
      const refreshedSession = await refreshSession(request);

      if (refreshedSession) {
        const retryUrl = new URL(pathname, request.url);
        retryUrl.search = request.nextUrl.search;
        return applyAuthCookies(NextResponse.redirect(retryUrl), refreshedSession);
      }
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);

    return clearAuthCookies(NextResponse.redirect(loginUrl));
  }

  if (isPublicOnlyPath && (accessTokenIsValid || refreshToken)) {
    if (accessTokenIsValid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const refreshedSession = await refreshSession(request);

    if (refreshedSession) {
      return applyAuthCookies(NextResponse.redirect(new URL('/dashboard', request.url)), refreshedSession);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
