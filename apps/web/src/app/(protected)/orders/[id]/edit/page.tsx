import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { OrderForm } from '@/features/orders/components/order-form';
import { mapOrderToFormValues } from '@/features/orders/schema';
import { fetchManagerOptions, fetchOrderById } from '@/features/orders/server';

type EditOrderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const session = await requireSession();
  const { id } = await params;
  const [order, managers] = await Promise.all([
    fetchOrderById(id),
    session.user.roleCode === 'admin' ? fetchManagerOptions() : Promise.resolve([]),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <OrderForm
      mode="edit"
      orderId={order.id}
      currentUser={session.user}
      managerOptions={managers}
      initialValues={mapOrderToFormValues(order)}
    />
  );
}
