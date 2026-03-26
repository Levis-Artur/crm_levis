'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getReturnStatusLabel, t, translateApiMessage } from '@/lib/i18n';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { getAllowedNextReturnStatuses } from '../constants';
import type { OrderReturnDetail } from '../types';
import { ReturnStatusBadge } from './return-status-badge';

interface ReturnActionsPanelProps {
  orderReturn: OrderReturnDetail;
}

export function ReturnActionsPanel({ orderReturn }: ReturnActionsPanelProps) {
  const router = useRouter();
  const [reason, setReason] = React.useState(orderReturn.reason ?? '');
  const [amount, setAmount] = React.useState(orderReturn.amount);
  const [nextStatusCode, setNextStatusCode] = React.useState('');
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [statusError, setStatusError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);

  const allowedTransitions = getAllowedNextReturnStatuses(orderReturn.returnStatusCode);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch(`/api/returns/${orderReturn.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason.trim() || undefined,
          amount: Number(amount),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        setSaveError(translateApiMessage(payload?.message, t.returns.returnUpdateError));
        return;
      }

      router.refresh();
    } catch {
      setSaveError(t.returns.returnUpdateError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!nextStatusCode) {
      setStatusError(t.returns.selectNextStatusError);
      return;
    }

    setIsUpdatingStatus(true);
    setStatusError(null);

    try {
      const response = await fetch(`/api/returns/${orderReturn.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnStatusCode: nextStatusCode,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        setStatusError(translateApiMessage(payload?.message, t.returns.statusUpdateError));
        return;
      }

      setNextStatusCode('');
      router.refresh();
    } catch {
      setStatusError(t.returns.statusUpdateError);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.returns.statusManagementTitle}</CardTitle>
          <CardDescription>{t.returns.statusManagementDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-secondary/25 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {t.returns.currentStatus}
              </p>
              <ReturnStatusBadge statusCode={orderReturn.returnStatusCode} className="mt-3" />
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>
                {orderReturn.resolvedAt
                  ? t.returns.resolvedAt(new Date(orderReturn.resolvedAt).toLocaleDateString('uk-UA'))
                  : t.returns.stillActive}
              </p>
            </div>
          </div>

          {allowedTransitions.length > 0 ? (
            <form className="space-y-4" onSubmit={handleStatusUpdate}>
              <div className="space-y-2">
                <Label htmlFor="nextStatusCode">{t.returns.nextStatus}</Label>
                <Select
                  id="nextStatusCode"
                  value={nextStatusCode}
                  onChange={(event) => setNextStatusCode(event.target.value)}
                >
                  <option value="">{t.returns.selectNextStatus}</option>
                  {allowedTransitions.map((statusCode) => (
                    <option key={statusCode} value={statusCode}>
                      {getReturnStatusLabel(statusCode)}
                    </option>
                  ))}
                </Select>
              </div>

              {statusError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {statusError}
                </div>
              ) : null}

              <Button type="submit" disabled={isUpdatingStatus}>
                {isUpdatingStatus ? t.returns.updatingStatus : t.common.updateStatus}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">{t.returns.terminalStateDescription}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.returns.returnDataTitle}</CardTitle>
          <CardDescription>{t.returns.returnDataDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-2">
              <Label htmlFor="returnAmount">{t.returns.returnAmountLabel}</Label>
              <Input
                id="returnAmount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnReason">{t.returns.reason}</Label>
              <Input
                id="returnReason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t.returns.reasonPlaceholder}
              />
            </div>
            {saveError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            ) : null}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? t.returns.saving : t.returns.saveReturnData}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
