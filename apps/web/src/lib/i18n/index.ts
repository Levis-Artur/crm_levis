import { uk } from './uk';
import { ukOverrides } from './uk-overrides';

export const t = {
  ...uk,
  navigation: {
    ...uk.navigation,
    ...ukOverrides.navigation,
  },
  orders: {
    ...uk.orders,
    ...ukOverrides.orders,
  },
  assistant: ukOverrides.assistant,
  validation: {
    ...uk.validation,
    ...ukOverrides.validation,
  },
  apiMessages: {
    ...uk.apiMessages,
    ...ukOverrides.apiMessages,
  },
} as const;

type LabelMap = Record<string, string>;

function mapCode(map: LabelMap, code: string | null | undefined, fallback?: string) {
  if (!code) {
    return fallback ?? t.common.notSet;
  }

  return map[code] ?? fallback ?? code;
}

export function translateApiMessage(
  message: string | string[] | null | undefined,
  fallback = t.common.genericError,
) {
  if (Array.isArray(message)) {
    return message.map((item) => t.apiMessages[item as keyof typeof t.apiMessages] ?? item).join(', ');
  }

  if (!message) {
    return fallback;
  }

  return t.apiMessages[message as keyof typeof t.apiMessages] ?? message;
}

export function getRoleLabel(roleCode: string) {
  return mapCode(t.labels.roles, roleCode, roleCode);
}

export function getStatusLabel(statusCode: string, fallback?: string) {
  return mapCode(t.labels.statuses, statusCode, fallback);
}

export function getOrderStatusLabel(statusCode: string, fallback?: string) {
  return getStatusLabel(statusCode, fallback);
}

export function getPaymentStatusLabel(statusCode: string, fallback?: string) {
  return getStatusLabel(statusCode, fallback);
}

export function getDeliveryStatusLabel(statusCode: string, fallback?: string) {
  return getStatusLabel(statusCode, fallback);
}

export function getReturnStatusLabel(statusCode: string, fallback?: string) {
  return getStatusLabel(statusCode, fallback);
}

export function getDeliveryMethodLabel(methodCode: string | null | undefined) {
  return mapCode(t.labels.deliveryMethods, methodCode, methodCode ?? t.common.notSet);
}

export function getFinanceCategoryLabel(categoryCode: string, fallback?: string) {
  return mapCode(t.labels.financeCategories, categoryCode, fallback ?? categoryCode);
}

export function getManagerPayoutStatusLabel(statusCode: string) {
  return mapCode(t.labels.managerPayoutStatuses, statusCode, statusCode);
}

export function getFinanceDirectionLabel(directionCode: string) {
  return mapCode(t.labels.financeDirections, directionCode, directionCode);
}

export function getShipmentProviderLabel(providerCode: string) {
  return mapCode(t.labels.shipmentProviders, providerCode, providerCode);
}
