import { Prisma } from '@prisma/client';

const managerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} as const satisfies Prisma.UserSelect;

const processedBySelect = managerSelect;

const orderSummarySelect = {
  id: true,
  orderNumber: true,
  managerId: true,
  customerName: true,
  customerPhone: true,
  customerPhoneExtra: true,
  customerEmail: true,
  city: true,
  totalAmount: true,
  saleAmount: true,
  purchaseAmount: true,
  marginAmount: true,
  currencyCode: true,
  orderStatusCode: true,
  placedAt: true,
  completedAt: true,
  isProblematic: true,
  manager: {
    select: managerSelect,
  },
  _count: {
    select: {
      items: true,
      shipments: true,
      orderReturns: true,
    },
  },
} as const satisfies Prisma.OrderSelect;

const orderDetailsSelect = {
  ...orderSummarySelect,
  items: {
    orderBy: [{ lineNumber: 'asc' }],
    select: {
      id: true,
      lineNumber: true,
      sku: true,
      purchaseLink: true,
      productName: true,
      quantity: true,
      salePrice: true,
      purchasePrice: true,
      discountAmount: true,
      lineTotal: true,
    },
  },
} as const satisfies Prisma.OrderSelect;

export const orderReturnListInclude = {
  returnStatus: true,
  processedBy: {
    select: processedBySelect,
  },
  order: {
    select: orderSummarySelect,
  },
} as const satisfies Prisma.OrderReturnInclude;

export const orderReturnDetailsInclude = {
  returnStatus: true,
  processedBy: {
    select: processedBySelect,
  },
  order: {
    select: orderDetailsSelect,
  },
} as const satisfies Prisma.OrderReturnInclude;

export type OrderReturnListRecord = Prisma.OrderReturnGetPayload<{
  include: typeof orderReturnListInclude;
}>;
export type OrderReturnDetailsRecord = Prisma.OrderReturnGetPayload<{
  include: typeof orderReturnDetailsInclude;
}>;

function presentManager(
  manager: OrderReturnListRecord['order']['manager'] | OrderReturnDetailsRecord['order']['manager'],
) {
  return {
    id: manager.id,
    firstName: manager.firstName,
    lastName: manager.lastName,
    email: manager.email,
    phone: manager.phone,
  };
}

function presentProcessedBy(
  processedBy: OrderReturnListRecord['processedBy'] | OrderReturnDetailsRecord['processedBy'],
) {
  if (!processedBy) {
    return null;
  }

  return {
    id: processedBy.id,
    firstName: processedBy.firstName,
    lastName: processedBy.lastName,
    email: processedBy.email,
    phone: processedBy.phone,
  };
}

function presentOrderBase(
  order: OrderReturnListRecord['order'] | OrderReturnDetailsRecord['order'],
) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    managerId: order.managerId,
    manager: presentManager(order.manager),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerPhoneExtra: order.customerPhoneExtra,
    customerEmail: order.customerEmail,
    city: order.city,
    totalAmount: order.totalAmount,
    saleAmount: order.saleAmount,
    purchaseAmount: order.purchaseAmount,
    marginAmount: order.marginAmount,
    currencyCode: order.currencyCode,
    orderStatusCode: order.orderStatusCode,
    placedAt: order.placedAt,
    completedAt: order.completedAt,
    isProblematic: order.isProblematic,
    counts: {
      items: order._count.items,
      shipments: order._count.shipments,
      orderReturns: order._count.orderReturns,
    },
  };
}

function presentReturnBase(
  record: OrderReturnListRecord | OrderReturnDetailsRecord,
) {
  return {
    id: record.id,
    returnNumber: record.returnNumber,
    orderId: record.orderId,
    returnStatusCode: record.returnStatusCode,
    returnStatus: {
      code: record.returnStatus.code,
      name: record.returnStatus.name,
      description: record.returnStatus.description,
      isTerminal: record.returnStatus.isTerminal,
    },
    processedById: record.processedById,
    processedBy: presentProcessedBy(record.processedBy),
    reason: record.reason,
    notes: record.notes,
    amount: record.amount,
    requestedAt: record.requestedAt,
    resolvedAt: record.resolvedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    order: presentOrderBase(record.order),
  };
}

export function presentOrderReturnListItem(record: OrderReturnListRecord) {
  return presentReturnBase(record);
}

export function presentOrderReturnDetail(record: OrderReturnDetailsRecord) {
  return {
    ...presentReturnBase(record),
    order: {
      ...presentOrderBase(record.order),
      items: record.order.items.map((item) => ({
        id: item.id,
        lineNumber: item.lineNumber,
        sku: item.sku,
        purchaseLink: item.purchaseLink,
        productName: item.productName,
        quantity: item.quantity,
        salePrice: item.salePrice,
        purchasePrice: item.purchasePrice,
        discountAmount: item.discountAmount,
        lineTotal: item.lineTotal,
      })),
    },
  };
}
