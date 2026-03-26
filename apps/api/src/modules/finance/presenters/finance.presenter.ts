import type { Prisma } from '@prisma/client';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} as const;

const financeCategorySelect = {
  code: true,
  name: true,
  description: true,
  direction: true,
} as const;

const orderSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  managerId: true,
} as const;

const orderReturnSelect = {
  id: true,
  returnNumber: true,
  orderId: true,
} as const;

export const financeTransactionInclude = {
  category: {
    select: financeCategorySelect,
  },
  manager: {
    select: userSelect,
  },
  order: {
    select: orderSelect,
  },
  orderReturn: {
    select: orderReturnSelect,
  },
} as const;

export const managerPayoutInclude = {
  manager: {
    select: userSelect,
  },
  createdBy: {
    select: userSelect,
  },
} as const;

export type FinanceTransactionRecord = Prisma.FinanceTransactionGetPayload<{
  include: typeof financeTransactionInclude;
}>;

export type ManagerPayoutRecord = Prisma.ManagerPayoutGetPayload<{
  include: typeof managerPayoutInclude;
}>;

function presentUser(
  user: FinanceTransactionRecord['manager'] | ManagerPayoutRecord['manager'] | ManagerPayoutRecord['createdBy'],
) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  };
}

export function presentFinanceTransaction(record: FinanceTransactionRecord) {
  return {
    id: record.id,
    categoryCode: record.categoryCode,
    category: {
      code: record.category.code,
      name: record.category.name,
      description: record.category.description,
      direction: record.category.direction,
    },
    managerId: record.managerId,
    manager: presentUser(record.manager),
    orderId: record.orderId,
    order: record.order
      ? {
          id: record.order.id,
          orderNumber: record.order.orderNumber,
          customerName: record.order.customerName,
          managerId: record.order.managerId,
        }
      : null,
    orderReturnId: record.orderReturnId,
    orderReturn: record.orderReturn
      ? {
          id: record.orderReturn.id,
          returnNumber: record.orderReturn.returnNumber,
          orderId: record.orderReturn.orderId,
        }
      : null,
    amount: record.amount,
    currencyCode: record.currencyCode,
    reference: record.reference,
    description: record.description,
    metadata: record.metadata,
    occurredAt: record.occurredAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function presentManagerPayout(record: ManagerPayoutRecord) {
  return {
    id: record.id,
    managerId: record.managerId,
    manager: presentUser(record.manager),
    createdById: record.createdById,
    createdBy: presentUser(record.createdBy),
    amount: record.amount,
    currencyCode: record.currencyCode,
    periodStart: record.periodStart,
    periodEnd: record.periodEnd,
    status: record.status,
    notes: record.notes,
    paidAt: record.paidAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
