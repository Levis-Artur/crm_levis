import { proxyAuthenticatedBackendRequest } from '@/lib/backend-proxy';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;

  return proxyAuthenticatedBackendRequest(`/shipments/${id}/sync`, {
    method: 'POST',
  });
}
