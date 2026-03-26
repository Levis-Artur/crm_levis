import { t } from '@/lib/i18n';

export const RETURN_STATUS_OPTIONS = [
  { value: 'requested', label: t.labels.statuses.requested },
  { value: 'approved', label: t.labels.statuses.approved },
  { value: 'received', label: t.labels.statuses.received },
  { value: 'refunded', label: t.labels.statuses.refunded },
  { value: 'rejected', label: t.labels.statuses.rejected },
] as const;

export const RETURN_STATUS_TRANSITION_MAP = {
  requested: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  received: ['refunded', 'rejected'],
  refunded: [],
  rejected: [],
} as const;

const RETURN_MOVE_BLOCKED_ORDER_STATUS_CODES = new Set(['cancelled', 'problematic']);

export function getAllowedNextReturnStatuses(statusCode: string) {
  if (!Object.prototype.hasOwnProperty.call(RETURN_STATUS_TRANSITION_MAP, statusCode)) {
    return [] as string[];
  }

  return [...RETURN_STATUS_TRANSITION_MAP[statusCode as keyof typeof RETURN_STATUS_TRANSITION_MAP]];
}

export function canMoveOrderToReturn(orderStatusCode: string, orderReturnCount: number) {
  return orderReturnCount === 0 && !RETURN_MOVE_BLOCKED_ORDER_STATUS_CODES.has(orderStatusCode);
}
