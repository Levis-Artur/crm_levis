export const TERMINAL_RETURN_STATUS_CODES = ['refunded', 'rejected'] as const;

export const RETURN_STATUS_TRANSITION_MAP = {
  requested: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  received: ['refunded', 'rejected'],
  refunded: [],
  rejected: [],
} as const;

export function hasConfiguredReturnStatusWorkflow(statusCode: string) {
  return Object.prototype.hasOwnProperty.call(RETURN_STATUS_TRANSITION_MAP, statusCode);
}

export function getAllowedNextReturnStatuses(statusCode: string) {
  if (!hasConfiguredReturnStatusWorkflow(statusCode)) {
    return [] as string[];
  }

  return [...RETURN_STATUS_TRANSITION_MAP[statusCode as keyof typeof RETURN_STATUS_TRANSITION_MAP]];
}

export function isResolvedReturnStatus(statusCode: string) {
  return TERMINAL_RETURN_STATUS_CODES.includes(
    statusCode as (typeof TERMINAL_RETURN_STATUS_CODES)[number],
  );
}
