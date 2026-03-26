'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Undo2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { t, translateApiMessage } from '@/lib/i18n';
import { canMoveOrderToReturn } from '../constants';

interface MoveToReturnButtonProps {
  orderId: string;
  orderStatusCode: string;
  orderReturnCount: number;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

export function MoveToReturnButton({
  orderId,
  orderStatusCode,
  orderReturnCount,
  variant = 'outline',
  size = 'sm',
  className,
}: MoveToReturnButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!canMoveOrderToReturn(orderStatusCode, orderReturnCount)) {
    return null;
  }

  const handleMoveToReturn = async () => {
    const confirmed = window.confirm(t.returns.moveToReturnConfirm);

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/move-to-return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const payload = (await response.json().catch(() => null)) as
        | { id?: string; message?: string | string[] }
        | null;

      if (!response.ok) {
        setError(translateApiMessage(payload?.message, t.returns.moveToReturnError));
        return;
      }

      if (!payload?.id) {
        setError(t.returns.moveToReturnMissingId);
        return;
      }

      router.push(`/returns/${payload.id}`);
      router.refresh();
    } catch {
      setError(t.returns.moveToReturnError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={() => void handleMoveToReturn()}
        disabled={isSubmitting}
      >
        <Undo2 className="mr-2 h-4 w-4" />
        {isSubmitting ? t.returns.movingToReturn : t.returns.moveToReturn}
      </Button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
