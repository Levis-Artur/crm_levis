import type { NovaPoshtaStatusMapping } from './nova-poshta.types';

const READY_TO_SHIP_KEYWORDS = [
  'створен',
  'создан',
  'оформлен',
  'накладн',
  'прийнят',
  'принят',
];

const IN_TRANSIT_KEYWORDS = [
  'дороз',
  'в пути',
  'transit',
  'відправлен',
  'отправлен',
  'пряму',
  'прибул',
  'прибыл',
  'сортув',
  'відділен',
  'отделен',
];

const DELIVERED_KEYWORDS = [
  'отриман',
  'получен',
  'видан',
  'выдан',
  'забран',
  'delivered',
];

const RETURNED_KEYWORDS = [
  'повернен',
  'возвращ',
  'відмов',
  'отказ',
  'return',
  'не забран',
  'не востреб',
];

const FAILED_KEYWORDS = [
  'не вруч',
  'не достав',
  'простроч',
  'зберіган',
  'storage',
  'cancel',
  'скас',
];

export function mapNovaPoshtaStatus(
  statusCode?: string | number | null,
  statusText?: string | null,
): NovaPoshtaStatusMapping {
  const externalStatusCode =
    statusCode === undefined || statusCode === null ? null : String(statusCode);
  const externalStatusText = normalizeStatusText(statusText);
  const normalized = (externalStatusText ?? '').toLowerCase();

  if (matchesAny(normalized, RETURNED_KEYWORDS)) {
    return buildMapping('returned', externalStatusCode, externalStatusText, {
      isTerminal: true,
    });
  }

  if (matchesAny(normalized, FAILED_KEYWORDS)) {
    return buildMapping('failed', externalStatusCode, externalStatusText, {
      isTerminal: true,
    });
  }

  if (matchesAny(normalized, DELIVERED_KEYWORDS)) {
    return buildMapping('delivered', externalStatusCode, externalStatusText, {
      shouldSetDispatchedAt: true,
      shouldSetDeliveredAt: true,
      isTerminal: true,
    });
  }

  if (matchesAny(normalized, IN_TRANSIT_KEYWORDS)) {
    return buildMapping('in_transit', externalStatusCode, externalStatusText, {
      shouldSetDispatchedAt: true,
    });
  }

  if (matchesAny(normalized, READY_TO_SHIP_KEYWORDS)) {
    return buildMapping('ready_to_ship', externalStatusCode, externalStatusText);
  }

  return buildMapping('pending', externalStatusCode, externalStatusText);
}

function buildMapping(
  deliveryStatusCode: string,
  externalStatusCode: string | null,
  externalStatusText: string | null,
  flags?: Partial<
    Pick<NovaPoshtaStatusMapping, 'shouldSetDispatchedAt' | 'shouldSetDeliveredAt' | 'isTerminal'>
  >,
): NovaPoshtaStatusMapping {
  return {
    deliveryStatusCode,
    externalStatusCode,
    externalStatusText,
    shouldSetDispatchedAt: flags?.shouldSetDispatchedAt ?? false,
    shouldSetDeliveredAt: flags?.shouldSetDeliveredAt ?? false,
    isTerminal: flags?.isTerminal ?? false,
  };
}

function normalizeStatusText(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

function matchesAny(value: string, keywords: readonly string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}
