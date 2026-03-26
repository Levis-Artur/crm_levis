import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.text();

  return proxyAuthenticatedBackendRequest(`/orders/${id}/shipment/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
}
