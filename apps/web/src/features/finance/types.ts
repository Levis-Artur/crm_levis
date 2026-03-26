import type { OrderManagerOption } from '@/features/orders/types';

export interface ManagerFinanceSummary {
  currencyCode: string;
  completedOrdersCount: number;
  totalMargin: string;
  totalEarnings: string;
  paidPayouts: string;
  pendingPayouts: string;
  availableToWithdraw: string;
  overpaidAmount: string;
}

export interface ManagerFinanceEarningItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  currencyCode: string;
  saleAmount: string;
  purchaseAmount: string;
  margin: string;
  managerEarnings: string;
  completedAt: string | null;
  createdAt: string;
}

export interface ManagerFinanceEarningsChartPoint {
  period: string;
  margin: number;
  earnings: number;
  ordersCount: number;
}

export interface ManagerFinanceEarningsResponse {
  items: ManagerFinanceEarningItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  chart: ManagerFinanceEarningsChartPoint[];
}

export interface FinanceUserSummary extends OrderManagerOption {}

export interface ManagerPayoutItem {
  id: string;
  managerId: string;
  manager: FinanceUserSummary | null;
  createdById: string | null;
  createdBy: FinanceUserSummary | null;
  amount: string;
  currencyCode: string;
  periodStart: string;
  periodEnd: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  notes: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerFinancePayoutsResponse {
  items: ManagerPayoutItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  paidTotal: string;
  pendingTotal: string;
}

export interface FinanceCategoryInfo {
  code: string;
  name: string;
  description: string | null;
  direction: 'INCOME' | 'EXPENSE';
}

export interface FinanceTransactionItem {
  id: string;
  categoryCode: string;
  category: FinanceCategoryInfo;
  managerId: string | null;
  manager: FinanceUserSummary | null;
  orderId: string | null;
  order:
    | {
        id: string;
        orderNumber: string;
        customerName: string;
        managerId: string;
      }
    | null;
  orderReturnId: string | null;
  orderReturn:
    | {
        id: string;
        returnNumber: string;
        orderId: string;
      }
    | null;
  amount: string;
  currencyCode: string;
  reference: string | null;
  description: string | null;
  metadata: unknown;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceTransactionsResponse {
  items: FinanceTransactionItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export interface AdminFinanceSummary {
  currencyCode: string;
  totalIncome: string;
  totalExpense: string;
  paidPayouts: string;
  netCashflow: string;
  categories: {
    saleIncome: string;
    returnsLoss: string;
    advertising: string;
    taxes: string;
    garage: string;
    logistics: string;
    otherExpense: string;
    manualIncomeAdjustment: string;
    manualExpenseAdjustment: string;
  };
  charts: {
    monthlyCashflow: Array<{
      period: string;
      income: number;
      expense: number;
    }>;
    expenseByCategory: Array<{
      categoryCode: string;
      label: string;
      amount: number;
    }>;
  };
}

export interface FinancePayoutsResponse {
  items: ManagerPayoutItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}
