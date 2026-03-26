import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyAuthenticatedBackendRequest(`/orders/${id}/shipment`, {
    method: 'GET',
  });
}
