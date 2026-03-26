import type { OrdersListFilters } from './types';

type SearchParamInput = Record<string, string | string[] | undefined>;

export function parseOrdersListSearchParams(searchParams: SearchParamInput): OrdersListFilters {
  const page = parsePositiveInteger(searchParams.page, 1);
  const limit = parsePositiveInteger(searchParams.limit, 20);

  return {
    page,
    limit: Math.min(limit, 100),
    search: pickSingleValue(searchParams.search),
    orderStatusCode: pickSingleValue(searchParams.orderStatusCode),
    managerId: pickSingleValue(searchParams.managerId),
    placedFrom: pickSingleValue(searchParams.placedFrom),
    placedTo: pickSingleValue(searchParams.placedTo),
  };
}

export function buildOrdersQueryString(filters: Partial<OrdersListFilters>) {
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

  if (filters.orderStatusCode) {
    params.set('orderStatusCode', filters.orderStatusCode);
  }

  if (filters.managerId) {
    params.set('managerId', filters.managerId);
  }

  if (filters.placedFrom) {
    params.set('placedFrom', filters.placedFrom);
  }

  if (filters.placedTo) {
    params.set('placedTo', filters.placedTo);
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
