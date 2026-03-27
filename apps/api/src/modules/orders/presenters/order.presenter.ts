import { Prisma } from '@prisma/client';

const orderManagerSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
} as const satisfies Prisma.UserSelect;

const statusSelect = {
  code: true,
  name: true,
  description: true,
  isTerminal: true,
} as const;

const paymentStatusSelect = {
  code: true,
  name: true,
  description: true,
  isFinal: true,
} as const;

const shipmentSelect = {
  id: true,
  provider: true,
  externalRef: true,
  trackingNumber: true,
  deliveryStatusCode: true,
  declaredValue: true,
  cashOnDeliveryAmount: true,
  shippingCost: true,
  dispatchedAt: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const orderListInclude = {
  manager: {
    select: orderManagerSelect,
  },
  orderStatus: {
    select: statusSelect,
  },
  paymentStatus: {
    select: paymentStatusSelect,
  },
  deliveryStatus: {
    select: statusSelect,
  },
  shipments: {
    select: shipmentSelect,
    orderBy: [{ createdAt: 'asc' }],
  },
  _count: {
    select: {
      items: true,
      shipments: true,
      orderReturns: true,
    },
  },
} as const satisfies Prisma.OrderInclude;

export const orderDetailsInclude = {
  ...orderListInclude,
  items: {
    orderBy: [{ lineNumber: 'asc' }],
  },
} as const satisfies Prisma.OrderInclude;

export type OrderListRecord = Prisma.OrderGetPayload<{
  include: typeof orderListInclude;
}>;
export type OrderDetailsRecord = Prisma.OrderGetPayload<{
  include: typeof orderDetailsInclude;
}>;

function presentManager(order: OrderListRecord | OrderDetailsRecord) {
  return {
    id: order.manager.id,
    firstName: order.manager.firstName,
    lastName: order.manager.lastName,
    email: order.manager.email,
    phone: order.manager.phone,
  };
}

function presentOrderBase(order: OrderListRecord | OrderDetailsRecord) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    managerId: order.managerId,
    manager: presentManager(order),
    orderStatusCode: order.orderStatusCode,
    orderStatus: {
      code: order.orderStatus.code,
      name: order.orderStatus.name,
      description: order.orderStatus.description,
      isTerminal: order.orderStatus.isTerminal,
    },
    paymentStatusCode: order.paymentStatusCode,
    paymentStatus: {
      code: order.paymentStatus.code,
      name: order.paymentStatus.name,
      description: order.paymentStatus.description,
      isFinal: order.paymentStatus.isFinal,
    },
    deliveryStatusCode: order.deliveryStatusCode,
    deliveryStatus: {
      code: order.deliveryStatus.code,
      name: order.deliveryStatus.name,
      description: order.deliveryStatus.description,
      isTerminal: order.deliveryStatus.isTerminal,
    },
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerPhoneExtra: order.customerPhoneExtra,
    customerEmail: order.customerEmail,
    city: order.city,
    deliveryPoint: order.deliveryPoint,
    deliveryMethod: order.deliveryMethod,
    paymentMethod: order.paymentMethod,
    currencyCode: order.currencyCode,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    totalAmount: order.totalAmount,
    purchaseAmount: order.purchaseAmount,
    saleAmount: order.saleAmount,
    marginAmount: order.marginAmount,
    prepaymentAmount: order.prepaymentAmount,
    shippingCost: order.shippingCost,
    notes: order.notes,
    internalNote: order.internalNote,
    cancelReason: order.cancelReason,
    isProblematic: order.isProblematic,
    placedAt: order.placedAt,
    completedAt: order.completedAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shipments: order.shipments.map((shipment) => ({
      id: shipment.id,
      provider: shipment.provider,
      externalRef: shipment.externalRef,
      trackingNumber: shipment.trackingNumber,
      deliveryStatusCode: shipment.deliveryStatusCode,
      declaredValue: shipment.declaredValue,
      cashOnDeliveryAmount: shipment.cashOnDeliveryAmount,
      shippingCost: shipment.shippingCost,
      dispatchedAt: shipment.dispatchedAt,
      deliveredAt: shipment.deliveredAt,
      createdAt: shipment.createdAt,
      updatedAt: shipment.updatedAt,
    })),
    counts: {
      items: order._count.items,
      shipments: order._count.shipments,
      orderReturns: order._count.orderReturns,
    },
  };
}

export function presentOrderListItem(order: OrderListRecord) {
  return presentOrderBase(order);
}

export function presentOrderDetail(order: OrderDetailsRecord) {
  return {
    ...presentOrderBase(order),
    items: order.items.map((item) => ({
      id: item.id,
      lineNumber: item.lineNumber,
      sku: item.sku,
      purchaseLink: item.purchaseLink,
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
  };
}

export type PresentedOrderListItem = ReturnType<typeof presentOrderListItem>;
export type PresentedOrderDetail = ReturnType<typeof presentOrderDetail>;
