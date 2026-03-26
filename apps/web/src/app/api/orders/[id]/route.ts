import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyAuthenticatedBackendRequest(`/orders/${id}`, {
    method: 'GET',
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.text();

  return proxyAuthenticatedBackendRequest(`/orders/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
}
