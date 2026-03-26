import { fetchManagerOptions } from '@/features/orders/server';
import { AdminFinanceView } from '@/features/finance/components/admin-finance-view';
import {
  fetchAdminFinanceSummary,
  fetchFinancePayouts,
  fetchFinanceTransactions,
} from '@/features/finance/server';

export default async function AdminFinancePage() {
  const [summary, transactions, payouts, managers] = await Promise.all([
    fetchAdminFinanceSummary(),
    fetchFinanceTransactions(),
    fetchFinancePayouts(),
    fetchManagerOptions(),
  ]);

  return (
    <AdminFinanceView
      summary={summary}
      transactions={transactions}
      payouts={payouts}
      managers={managers}
    />
  );
}
