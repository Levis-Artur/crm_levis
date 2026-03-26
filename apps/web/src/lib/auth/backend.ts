import { t } from '@/lib/i18n';
import { getApiBaseUrl } from './env';
import type { LoginResponse, SessionResponse } from './types';

async function parseJson<T>(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null as T | null;
  }

  return (await response.json()) as T;
}

export async function backendFetch(
  path: string,
  init?: RequestInit & {
    accessToken?: string;
  },
) {
  const { accessToken, headers, ...rest } = init ?? {};

  return fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    cache: 'no-store',
    headers: {
      ...(headers ?? {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}

export async function loginWithBackend(identifier: string, password: string) {
  const response = await backendFetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await parseJson<LoginResponse & { message?: string | string[] }>(response);

  if (!response.ok || !data) {
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message ?? t.auth.signInError,
    );
  }

  return data;
}

export async function logoutWithBackend(accessToken?: string) {
  if (!accessToken) {
    return;
  }

  await backendFetch('/auth/logout', {
    method: 'POST',
    accessToken,
  });
}

export async function refreshWithBackend(refreshToken: string) {
  const response = await backendFetch('/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await parseJson<LoginResponse & { message?: string | string[] }>(response);

  if (!response.ok || !data) {
    return null;
  }

  return data;
}

export async function fetchCurrentUser(accessToken: string) {
  const response = await backendFetch('/auth/me', {
    method: 'GET',
    accessToken,
  });

  if (!response.ok) {
    return null;
  }

  return parseJson<SessionResponse>(response);
}
