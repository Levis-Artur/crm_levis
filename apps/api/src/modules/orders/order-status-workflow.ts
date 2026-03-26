export const FULLY_COMPLETED_ORDER_STATUS_CODE = 'fully_completed';

export const ACTIVE_ORDER_STATUS_CODES = [
  'new',
  'confirmed',
  'in_progress',
  'preparing_shipment',
  'shipped',
  'delivered_to_branch',
  'received_by_customer',
] as const;

export const ORDER_STATUS_TRANSITION_MAP = {
  new: ['confirmed', 'cancelled', 'problematic'],
  confirmed: ['in_progress', 'cancelled', 'problematic'],
  in_progress: ['preparing_shipment', 'cancelled', 'problematic'],
  preparing_shipment: ['shipped', 'cancelled', 'problematic'],
  shipped: ['delivered_to_branch', 'cancelled', 'problematic'],
  delivered_to_branch: ['received_by_customer', 'cancelled', 'problematic'],
  received_by_customer: ['fully_completed', 'cancelled', 'problematic'],
  fully_completed: [],
  cancelled: [],
  problematic: [],
} as const;

export function hasConfiguredOrderStatusWorkflow(statusCode: string) {
  return Object.prototype.hasOwnProperty.call(ORDER_STATUS_TRANSITION_MAP, statusCode);
}

export function getAllowedNextOrderStatuses(statusCode: string) {
  if (!hasConfiguredOrderStatusWorkflow(statusCode)) {
    return [] as string[];
  }

  return [...ORDER_STATUS_TRANSITION_MAP[statusCode as keyof typeof ORDER_STATUS_TRANSITION_MAP]];
}

export function isCompletedOrderStatus(statusCode: string) {
  return statusCode === FULLY_COMPLETED_ORDER_STATUS_CODE;
}
