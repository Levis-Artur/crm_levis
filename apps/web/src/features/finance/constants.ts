import { t } from '@/lib/i18n';

export const FINANCE_CATEGORY_OPTIONS = [
  { code: 'sale_income', label: t.labels.financeCategories.sale_income, direction: 'INCOME' },
  {
    code: 'manager_salary',
    label: t.labels.financeCategories.manager_salary,
    direction: 'EXPENSE',
  },
  { code: 'returns_loss', label: t.labels.financeCategories.returns_loss, direction: 'EXPENSE' },
  { code: 'advertising', label: t.labels.financeCategories.advertising, direction: 'EXPENSE' },
  { code: 'taxes', label: t.labels.financeCategories.taxes, direction: 'EXPENSE' },
  { code: 'garage', label: t.labels.financeCategories.garage, direction: 'EXPENSE' },
  { code: 'logistics', label: t.labels.financeCategories.logistics, direction: 'EXPENSE' },
  {
    code: 'other_expense',
    label: t.labels.financeCategories.other_expense,
    direction: 'EXPENSE',
  },
  {
    code: 'manual_income_adjustment',
    label: t.labels.financeCategories.manual_income_adjustment,
    direction: 'INCOME',
  },
  {
    code: 'manual_expense_adjustment',
    label: t.labels.financeCategories.manual_expense_adjustment,
    direction: 'EXPENSE',
  },
] as const;

export const MANAGER_PAYOUT_STATUS_LABELS: Record<string, string> = {
  PENDING: t.labels.managerPayoutStatuses.PENDING,
  APPROVED: t.labels.managerPayoutStatuses.APPROVED,
  PAID: t.labels.managerPayoutStatuses.PAID,
  CANCELLED: t.labels.managerPayoutStatuses.CANCELLED,
};
