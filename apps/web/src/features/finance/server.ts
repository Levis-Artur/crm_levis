import 'server-only';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/auth/backend';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { t } from '@/lib/i18n';
import type {
  AdminFinanceSummary,
  FinancePayoutsResponse,
  FinanceTransactionsResponse,
  ManagerFinanceEarningsResponse,
  ManagerFinancePayoutsResponse,
  ManagerFinanceSummary,
} from './types';

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

async function requireAccessToken() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new Error(t.common.unauthorized);
  }

  return accessToken;
}

export async function fetchMyFinanceSummary() {
  const accessToken = await requireAccessToken();
  const response = await backendFetch('/me/finance/summary', { method: 'GET', accessToken });
  const data = await readJson<ManagerFinanceSummary & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.finance.manager.loadSummaryError);
  }

  return data;
}

export async function fetchMyFinanceEarnings() {
  const accessToken = await requireAccessToken();
  const response = await backendFetch('/me/finance/earnings?limit=10', { method: 'GET', accessToken });
  const data = await readJson<ManagerFinanceEarningsResponse & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.finance.manager.loadEarningsError);
  }

  return data;
}

export async function fetchMyFinancePayouts() {
  const accessToken = await requireAccessToken();
  const response = await backendFetch('/me/finance/payouts?limit=8', { method: 'GET', accessToken });
  const data = await readJson<ManagerFinancePayoutsResponse & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.finance.manager.loadPayoutsError);
  }

  return data;
}

export async function fetchAdminFinanceSummary() {
  const accessToken = await requireAccessToken();
  const response = await backendFetch('/finance/summary', { method: 'GET', accessToken });
  const data = await readJson<AdminFinanceSummary & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.finance.admin.loadSummaryError);
  }

  return data;
}

export async function fetchFinanceTransactions() {
  const accessToken = await requireAccessToken();
  const response = await backendFetch('/finance/transactions?limit=10', {
    method: 'GET',
    accessToken,
  });
  const data = await readJson<FinanceTransactionsResponse & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.finance.admin.loadTransactionsError);
  }

  return data;
}

export async function fetchFinancePayouts() {
  const accessToken = await requireAccessToken();
  const response = await backendFetch('/finance/payouts?limit=8', {
    method: 'GET',
    accessToken,
  });
  const data = await readJson<FinancePayoutsResponse & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.finance.admin.loadPayoutsError);
  }

  return data;
}
