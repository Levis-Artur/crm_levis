import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

export async function POST(request: Request) {
  const body = await request.text();

  return proxyAuthenticatedBackendRequest('/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
}
