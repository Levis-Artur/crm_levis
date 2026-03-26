'use client';

import { Badge } from '@/components/ui/badge';
import { getReturnStatusLabel } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatOrderStatusLabel, getStatusTone } from '@/features/orders/format';

interface ReturnStatusBadgeProps {
  statusCode: string;
  label?: string;
  className?: string;
}

export function ReturnStatusBadge({ statusCode, label, className }: ReturnStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
        getStatusTone(statusCode),
        className,
      )}
    >
      {getReturnStatusLabel(statusCode, label ?? formatOrderStatusLabel(statusCode))}
    </Badge>
  );
}
