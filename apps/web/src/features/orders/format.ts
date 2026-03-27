import { getStatusLabel, t } from '@/lib/i18n';

const dateTimeFormatter = new Intl.DateTimeFormat('uk-UA', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return t.common.notSet;
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatCurrency(value: number | string, currencyCode = 'UAH') {
  void currencyCode;
  const amount = typeof value === 'number' ? value : Number(value);

  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatOrderStatusLabel(statusCode: string) {
  return getStatusLabel(statusCode);
}

export function getStatusTone(statusCode: string) {
  switch (statusCode) {
    case 'new':
    case 'requested':
    case 'confirmed':
    case 'approved':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'in_progress':
    case 'received':
    case 'preparing_shipment':
    case 'shipped':
    case 'delivered_to_branch':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'received_by_customer':
    case 'fully_completed':
    case 'paid':
    case 'delivered':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'cancelled':
    case 'failed':
    case 'returned':
    case 'refunded':
    case 'rejected':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'problematic':
      return 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700';
    default:
      return 'border-border bg-secondary/60 text-secondary-foreground';
  }
}
