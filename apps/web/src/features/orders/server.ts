import 'server-only';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/auth/backend';
import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { t } from '@/lib/i18n';
import type {
  OrderDetail,
  OrderManagerOption,
  OrdersListFilters,
  OrdersListResponse,
  OrderShipmentResponse,
} from './types';
import { buildOrdersQueryString } from './query';

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

export async function fetchOrders(filters: OrdersListFilters) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new Error(t.common.unauthorized);
  }

  const query = buildOrdersQueryString(filters);
  const response = await backendFetch(`/orders${query ? `?${query}` : ''}`, {
    method: 'GET',
    accessToken,
  });

  const data = await readJson<OrdersListResponse & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.orders.loadOrdersError);
  }

  return data;
}

export async function fetchOrderById(orderId: string) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new Error(t.common.unauthorized);
  }

  const response = await backendFetch(`/orders/${orderId}`, {
    method: 'GET',
    accessToken,
  });

  if (response.status === 404) {
    return null;
  }

  const data = await readJson<OrderDetail & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.orders.loadOrderDetailsError);
  }

  return data;
}

export async function fetchManagerOptions() {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    return [] as OrderManagerOption[];
  }

  const response = await backendFetch('/users?roleCode=manager&limit=100', {
    method: 'GET',
    accessToken,
  });

  if (!response.ok) {
    return [] as OrderManagerOption[];
  }

  const data = await readJson<{
    items: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    }>;
  }>(response);

  return data?.items ?? [];
}

export async function fetchOrderShipment(orderId: string) {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    throw new Error(t.common.unauthorized);
  }

  const response = await backendFetch(`/orders/${orderId}/shipment`, {
    method: 'GET',
    accessToken,
  });

  const data = await readJson<OrderShipmentResponse & { message?: string }>(response);

  if (!response.ok || !data) {
    throw new Error(data?.message ?? t.orders.loadShipmentError);
  }

  return data.shipment;
}
