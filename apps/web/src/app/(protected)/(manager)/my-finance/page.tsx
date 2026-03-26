import { ManagerFinanceView } from '@/features/finance/components/manager-finance-view';
import {
  fetchMyFinanceEarnings,
  fetchMyFinancePayouts,
  fetchMyFinanceSummary,
} from '@/features/finance/server';

export default async function MyFinancePage() {
  const [summary, earnings, payouts] = await Promise.all([
    fetchMyFinanceSummary(),
    fetchMyFinanceEarnings(),
    fetchMyFinancePayouts(),
  ]);

  return <ManagerFinanceView summary={summary} earnings={earnings} payouts={payouts} />;
}
