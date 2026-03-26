import 'server-only';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/auth/backend';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { t } from '@/lib/i18n';
import type { OrderReturnDetail, ReturnsListFilters, ReturnsListResponse } from './types';
import { buildReturnsQueryString } from './query';

async function readJson<T>(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    return null as T | null;
  }

  return (await response.json()) as T;
}

async function getServerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function fetchReturns(filters: ReturnsListFilters) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new Error(t.common.unauthorized);
  }

  const query = buildReturnsQueryString(filters);
  const response = await backendFetch(`/returns${query ? `?${query}` : ''}`, {
    method: 'GET',
    accessToken,
  });

  const data = await readJson<ReturnsListResponse & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.returns.loadReturnsError);
  }

  return data;
}

export async function fetchReturnById(returnId: string) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new Error(t.common.unauthorized);
  }

  const response = await backendFetch(`/returns/${returnId}`, {
    method: 'GET',
    accessToken,
  });

  if (response.status === 404) {
    return null;
  }

  const data = await readJson<OrderReturnDetail & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.returns.loadReturnDetailsError);
  }

  return data;
}
