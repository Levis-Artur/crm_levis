import type { ReturnsListFilters } from './types';

type SearchParamInput = Record<string, string | string[] | undefined>;

export function parseReturnsListSearchParams(searchParams: SearchParamInput): ReturnsListFilters {
  const page = parsePositiveInteger(searchParams.page, 1);
  const limit = parsePositiveInteger(searchParams.limit, 20);

  return {
    page,
    limit: Math.min(limit, 100),
    search: pickSingleValue(searchParams.search),
    returnStatusCode: pickSingleValue(searchParams.returnStatusCode),
    managerId: pickSingleValue(searchParams.managerId),
    orderId: pickSingleValue(searchParams.orderId),
    requestedFrom: pickSingleValue(searchParams.requestedFrom),
    requestedTo: pickSingleValue(searchParams.requestedTo),
  };
}

export function buildReturnsQueryString(filters: Partial<ReturnsListFilters>) {
  const params = new URLSearchParams();

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  if (filters.limit && filters.limit !== 20) {
    params.set('limit', String(filters.limit));
  }

  if (filters.search) {
    params.set('search', filters.search);
  }

  if (filters.returnStatusCode) {
    params.set('returnStatusCode', filters.returnStatusCode);
  }

  if (filters.managerId) {
    params.set('managerId', filters.managerId);
  }

  if (filters.orderId) {
    params.set('orderId', filters.orderId);
  }

  if (filters.requestedFrom) {
    params.set('requestedFrom', filters.requestedFrom);
  }

  if (filters.requestedTo) {
    params.set('requestedTo', filters.requestedTo);
  }

  return params.toString();
}

function pickSingleValue(value: string | string[] | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized?.trim() ? normalized.trim() : undefined;
}

function parsePositiveInteger(value: string | string[] | undefined, fallback: number) {
  const raw = pickSingleValue(value);
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
