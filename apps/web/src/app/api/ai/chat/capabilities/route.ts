import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

export async function GET() {
  return proxyAuthenticatedBackendRequest('/ai/chat/capabilities', {
    method: 'GET',
  });
}
