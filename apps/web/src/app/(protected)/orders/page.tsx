import { requireSession } from '@/lib/auth/session';
import { OrdersListView } from '@/features/orders/components/orders-list-view';
import { parseOrdersListSearchParams } from '@/features/orders/query';
import { fetchManagerOptions, fetchOrders } from '@/features/orders/server';

type OrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await requireSession();
  const filters = parseOrdersListSearchParams(await searchParams);
  const [orders, managers] = await Promise.all([
    fetchOrders(filters),
    session.user.roleCode === 'admin' ? fetchManagerOptions() : Promise.resolve([]),
  ]);

  return (
    <OrdersListView
      role={session.user.roleCode}
      filters={filters}
      managers={managers}
      orders={orders}
    />
  );
}
