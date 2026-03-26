import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();

  return proxyAuthenticatedBackendRequest(`/returns${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}
