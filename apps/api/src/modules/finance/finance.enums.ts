export const FinanceDirection = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export type FinanceDirection = (typeof FinanceDirection)[keyof typeof FinanceDirection];

export const ManagerPayoutStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export type ManagerPayoutStatus = (typeof ManagerPayoutStatus)[keyof typeof ManagerPayoutStatus];
