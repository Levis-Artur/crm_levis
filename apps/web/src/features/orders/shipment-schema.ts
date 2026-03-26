import { z } from 'zod';
import { t } from '@/lib/i18n';
import type { CreateOrderShipmentPayload, OrderDetail } from './types';

const optionalText = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().optional(),
);

const optionalNumber = (min: number, message: string) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }, z.number().min(min, message).optional());

const optionalInteger = (min: number, message: string) =>
  z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }

    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }, z.number().int().min(min, message).optional());

export const orderShipmentFormSchema = z.object({
  recipientRef: z.string().trim().min(1, t.validation.recipientRefRequired),
  recipientContactRef: z.string().trim().min(1, t.validation.recipientContactRefRequired),
  recipientCityRef: z.string().trim().min(1, t.validation.recipientCityRefRequired),
  recipientWarehouseRef: z.string().trim().min(1, t.validation.recipientWarehouseRefRequired),
  recipientName: optionalText,
  recipientPhone: optionalText,
  destinationCity: optionalText,
  destinationBranch: optionalText,
  cargoDescription: optionalText,
  declaredValue: optionalNumber(0, t.validation.declaredValueMin),
  cashOnDeliveryAmount: optionalNumber(0, t.validation.cashOnDeliveryMin),
  shippingCost: optionalNumber(0, t.validation.shippingCostMin),
  weight: optionalNumber(0.001, t.validation.weightMin),
  seatsAmount: optionalInteger(1, t.validation.seatsAmountMin),
});

export type OrderShipmentFormValues = z.infer<typeof orderShipmentFormSchema>;

export function createOrderShipmentDefaultValues(order: OrderDetail): OrderShipmentFormValues {
  const totalAmount = toNumber(order.totalAmount);
  const prepaymentAmount = toNumber(order.prepaymentAmount);
  const remainingCashOnDelivery = Math.max(0, totalAmount - prepaymentAmount);

  return {
    recipientRef: '',
    recipientContactRef: '',
    recipientCityRef: '',
    recipientWarehouseRef: '',
    recipientName: order.customerName,
    recipientPhone: order.customerPhone ?? undefined,
    destinationCity: order.city ?? undefined,
    destinationBranch: order.deliveryPoint ?? undefined,
    cargoDescription: `Замовлення ${order.orderNumber}`,
    declaredValue: toNumber(order.saleAmount),
    cashOnDeliveryAmount: remainingCashOnDelivery,
    shippingCost: toNumber(order.shippingCost),
    weight: undefined,
    seatsAmount: undefined,
  };
}

export function buildOrderShipmentPayload(
  values: OrderShipmentFormValues,
): CreateOrderShipmentPayload {
  return {
    recipientRef: values.recipientRef.trim(),
    recipientContactRef: values.recipientContactRef.trim(),
    recipientCityRef: values.recipientCityRef.trim(),
    recipientWarehouseRef: values.recipientWarehouseRef.trim(),
    recipientName: values.recipientName,
    recipientPhone: values.recipientPhone,
    destinationCity: values.destinationCity,
    destinationBranch: values.destinationBranch,
    cargoDescription: values.cargoDescription,
    declaredValue: values.declaredValue,
    cashOnDeliveryAmount: values.cashOnDeliveryAmount,
    shippingCost: values.shippingCost,
    weight: values.weight,
    seatsAmount: values.seatsAmount,
  };
}

function toNumber(value: number | string) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
