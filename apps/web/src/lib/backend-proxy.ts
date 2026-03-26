import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { backendFetch } from './auth/backend';
import { ACCESS_TOKEN_COOKIE } from './auth/constants';
import { t } from './i18n';

type ProxyRequestInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | null;
};

export async function proxyAuthenticatedBackendRequest(
  path: string,
  init?: ProxyRequestInit,
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ message: t.common.unauthorized }, { status: 401 });
  }

  const response = await backendFetch(path, {
    ...init,
    accessToken,
  });

  const contentType = response.headers.get('content-type');
  const text = await response.text();

  return new NextResponse(text || null, {
    status: response.status,
    headers: contentType ? { 'Content-Type': contentType } : undefined,
  });
}
