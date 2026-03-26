import { t } from '@/lib/i18n';

export const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: t.labels.statuses.new },
  { value: 'confirmed', label: t.labels.statuses.confirmed },
  { value: 'in_progress', label: t.labels.statuses.in_progress },
  { value: 'preparing_shipment', label: t.labels.statuses.preparing_shipment },
  { value: 'shipped', label: t.labels.statuses.shipped },
  { value: 'delivered_to_branch', label: t.labels.statuses.delivered_to_branch },
  { value: 'received_by_customer', label: t.labels.statuses.received_by_customer },
  { value: 'fully_completed', label: t.labels.statuses.fully_completed },
  { value: 'cancelled', label: t.labels.statuses.cancelled },
  { value: 'problematic', label: t.labels.statuses.problematic },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'unpaid', label: t.labels.statuses.unpaid },
  { value: 'partial', label: t.labels.statuses.partial },
  { value: 'paid', label: t.labels.statuses.paid },
  { value: 'refunded', label: t.labels.statuses.refunded },
] as const;

export const DELIVERY_METHOD_OPTIONS = [
  { value: 'nova_poshta_branch', label: t.labels.deliveryMethods.nova_poshta_branch },
  { value: 'nova_poshta_courier', label: t.labels.deliveryMethods.nova_poshta_courier },
  { value: 'pickup', label: t.labels.deliveryMethods.pickup },
  { value: 'other', label: t.labels.deliveryMethods.other },
] as const;
