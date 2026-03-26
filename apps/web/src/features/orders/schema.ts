import { z } from 'zod';
import type { AppRole } from '@/lib/auth/types';
import { t } from '@/lib/i18n';
import type { OrderDetail } from './types';

const orderItemSchema = z
  .object({
    sku: z.string().trim().max(100).optional().or(z.literal('')),
    purchaseLink: z.string().trim().url(t.validation.validUrl).optional().or(z.literal('')),
    productName: z.string().trim().min(1, t.validation.productNameRequired),
    quantity: z.coerce.number().int().min(1, t.validation.quantityMin),
    purchasePrice: z.coerce.number().min(0),
    salePrice: z.coerce.number().min(0, t.validation.salePriceMin),
    discountAmount: z.coerce.number().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.discountAmount > value.salePrice * value.quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountAmount'],
        message: t.common.genericError,
      });
    }
  });

export const orderFormSchema = z.object({
  managerId: z.string().trim().optional().or(z.literal('')),
  customerName: z.string().trim().min(1, t.validation.customerNameRequired),
  customerPhone: z.string().trim().min(5).optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  deliveryPoint: z.string().trim().optional().or(z.literal('')),
  deliveryMethod: z.string().trim().optional().or(z.literal('')),
  paymentStatusCode: z.string().trim().optional().or(z.literal('')),
  currencyCode: z.string().trim().length(3).default('UAH'),
  prepaymentAmount: z.coerce.number().min(0, t.validation.prepaymentMin),
  shippingCost: z.coerce.number().min(0, t.validation.shippingCostMin),
  comment: z.string().trim().optional().or(z.literal('')),
  internalNote: z.string().trim().optional().or(z.literal('')),
  cancelReason: z.string().trim().optional().or(z.literal('')),
  isProblematic: z.boolean().default(false),
  items: z.array(orderItemSchema).min(1, t.validation.minOrderItems),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export function createEmptyOrderItem() {
  return {
    sku: '',
    purchaseLink: '',
    productName: '',
    quantity: 1,
    purchasePrice: 0,
    salePrice: 0,
    discountAmount: 0,
  };
}

export function getOrderFormDefaults(role: AppRole, currentUserId: string): OrderFormValues {
  return {
    managerId: role === 'manager' ? currentUserId : '',
    customerName: '',
    customerPhone: '',
    city: '',
    deliveryPoint: '',
    deliveryMethod: 'nova_poshta_branch',
    paymentStatusCode: 'unpaid',
    currencyCode: 'UAH',
    prepaymentAmount: 0,
    shippingCost: 0,
    comment: '',
    internalNote: '',
    cancelReason: '',
    isProblematic: false,
    items: [createEmptyOrderItem()],
  };
}

export function mapOrderToFormValues(order: OrderDetail): OrderFormValues {
  return {
    managerId: order.managerId,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? '',
    city: order.city ?? '',
    deliveryPoint: order.deliveryPoint ?? '',
    deliveryMethod: order.deliveryMethod ?? '',
    paymentStatusCode: order.paymentStatusCode ?? '',
    currencyCode: order.currencyCode,
    prepaymentAmount: Number(order.prepaymentAmount),
    shippingCost: Number(order.shippingCost),
    comment: order.notes ?? '',
    internalNote: order.internalNote ?? '',
    cancelReason: order.cancelReason ?? '',
    isProblematic: order.isProblematic,
    items: order.items.map((item) => ({
      sku: item.sku ?? '',
      purchaseLink: item.purchaseLink ?? '',
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: Number(item.purchasePrice),
      salePrice: Number(item.salePrice),
      discountAmount: Number(item.discountAmount),
    })),
  };
}

export function buildOrderPayload(values: OrderFormValues, role: AppRole) {
  const normalizedManagerId =
    role === 'manager' ? undefined : values.managerId?.trim() ? values.managerId.trim() : undefined;

  return {
    ...(normalizedManagerId ? { managerId: normalizedManagerId } : {}),
    customerName: values.customerName.trim(),
    ...(values.customerPhone?.trim() ? { customerPhone: values.customerPhone.trim() } : {}),
    ...(values.city?.trim() ? { city: values.city.trim() } : {}),
    ...(values.deliveryPoint?.trim() ? { deliveryPoint: values.deliveryPoint.trim() } : {}),
    ...(values.deliveryMethod?.trim() ? { deliveryMethod: values.deliveryMethod.trim() } : {}),
    ...(values.paymentStatusCode?.trim()
      ? { paymentStatusCode: values.paymentStatusCode.trim() }
      : {}),
    currencyCode: values.currencyCode.trim().toUpperCase(),
    prepaymentAmount: values.prepaymentAmount,
    shippingCost: values.shippingCost,
    ...(values.comment?.trim() ? { comment: values.comment.trim() } : {}),
    ...(values.internalNote?.trim() ? { internalNote: values.internalNote.trim() } : {}),
    ...(values.cancelReason?.trim() ? { cancelReason: values.cancelReason.trim() } : {}),
    isProblematic: values.isProblematic,
    items: values.items.map((item) => ({
      ...(item.sku?.trim() ? { sku: item.sku.trim() } : {}),
      ...(item.purchaseLink?.trim() ? { purchaseLink: item.purchaseLink.trim() } : {}),
      productName: item.productName.trim(),
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      discountAmount: item.discountAmount,
    })),
  };
}
