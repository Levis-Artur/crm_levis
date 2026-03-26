'use client';

import { Badge } from '@/components/ui/badge';
import { getStatusLabel } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatOrderStatusLabel, getStatusTone } from '../format';

interface OrderStatusBadgeProps {
  statusCode: string;
  label?: string;
  className?: string;
}

export function OrderStatusBadge({ statusCode, label, className }: OrderStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        getStatusTone(statusCode),
        className,
      )}
    >
      {getStatusLabel(statusCode, label ?? formatOrderStatusLabel(statusCode))}
    </Badge>
  );
}
