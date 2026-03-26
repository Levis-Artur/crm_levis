import { requireSession } from '@/lib/auth/session';
import { OrderForm } from '@/features/orders/components/order-form';
import { getOrderFormDefaults } from '@/features/orders/schema';
import { fetchManagerOptions } from '@/features/orders/server';

export default async function NewOrderPage() {
  const session = await requireSession();
  const managers =
    session.user.roleCode === 'admin' ? await fetchManagerOptions() : [];

  return (
    <OrderForm
      mode="create"
      currentUser={session.user}
      managerOptions={managers}
      initialValues={getOrderFormDefaults(session.user.roleCode, session.user.id)}
    />
  );
}
