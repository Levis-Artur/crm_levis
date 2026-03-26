import type { Prisma } from '@prisma/client';

const deliveryStatusSelect = {
  code: true,
  name: true,
  description: true,
  isTerminal: true,
} as const;

const shipmentOrderSelect = {
  id: true,
  orderNumber: true,
  managerId: true,
  customerName: true,
  deliveryStatusCode: true,
} as const;

export const shipmentDetailsInclude = {
  deliveryStatus: {
    select: deliveryStatusSelect,
  },
  order: {
    select: shipmentOrderSelect,
  },
} as const;

export type ShipmentDetailsRecord = Prisma.ShipmentGetPayload<{
  include: typeof shipmentDetailsInclude;
}>;

export function presentShipmentDetail(shipment: ShipmentDetailsRecord) {
  return {
    id: shipment.id,
    orderId: shipment.orderId,
    provider: shipment.provider,
    externalRef: shipment.externalRef,
    trackingNumber: shipment.trackingNumber,
    deliveryStatusCode: shipment.deliveryStatusCode,
    deliveryStatus: {
      code: shipment.deliveryStatus.code,
      name: shipment.deliveryStatus.name,
      description: shipment.deliveryStatus.description,
      isTerminal: shipment.deliveryStatus.isTerminal,
    },
    recipientName: shipment.recipientName,
    recipientPhone: shipment.recipientPhone,
    destinationCity: shipment.destinationCity,
    destinationBranch: shipment.destinationBranch,
    declaredValue: shipment.declaredValue,
    cashOnDeliveryAmount: shipment.cashOnDeliveryAmount,
    shippingCost: shipment.shippingCost,
    metadata: shipment.metadata,
    lastSyncedAt: shipment.lastSyncedAt,
    dispatchedAt: shipment.dispatchedAt,
    deliveredAt: shipment.deliveredAt,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    order: {
      id: shipment.order.id,
      orderNumber: shipment.order.orderNumber,
      managerId: shipment.order.managerId,
      customerName: shipment.order.customerName,
      deliveryStatusCode: shipment.order.deliveryStatusCode,
    },
  };
}

export type PresentedShipmentDetail = ReturnType<typeof presentShipmentDetail>;
