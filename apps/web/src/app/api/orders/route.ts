import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();

  return proxyAuthenticatedBackendRequest(`/orders${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

export async function POST(request: Request) {
  const body = await request.text();

  return proxyAuthenticatedBackendRequest('/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
}
