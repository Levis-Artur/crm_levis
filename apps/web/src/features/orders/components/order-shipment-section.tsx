'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCcw, Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getDeliveryStatusLabel,
  getShipmentProviderLabel,
  t,
  translateApiMessage,
} from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDateTime } from '../format';
import {
  buildOrderShipmentPayload,
  createOrderShipmentDefaultValues,
  orderShipmentFormSchema,
  type OrderShipmentFormValues,
} from '../shipment-schema';
import type { OrderDetail, OrderShipmentDetail } from '../types';
import { OrderStatusBadge } from './order-status-badge';

interface OrderShipmentSectionProps {
  order: OrderDetail;
  shipment: OrderShipmentDetail | null;
}

export function OrderShipmentSection({ order, shipment }: OrderShipmentSectionProps) {
  const router = useRouter();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrderShipmentFormValues>({
    resolver: zodResolver(orderShipmentFormSchema),
    defaultValues: createOrderShipmentDefaultValues(order),
  });

  const onCreateShipment = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const response = await fetch(`/api/orders/${order.id}/shipment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildOrderShipmentPayload(values)),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        setSubmitError(translateApiMessage(payload?.message, t.orders.shipmentCreateError));
        return;
      }

      router.refresh();
    } catch {
      setSubmitError(t.orders.shipmentCreateError);
    }
  });

  const handleSyncShipment = async () => {
    if (!shipment) {
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch(`/api/shipments/${shipment.id}/sync`, {
        method: 'POST',
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        setSyncError(translateApiMessage(payload?.message, t.orders.shipmentSyncError));
        return;
      }

      router.refresh();
    } catch {
      setSyncError(t.orders.shipmentSyncError);
    } finally {
      setIsSyncing(false);
    }
  };

  if (shipment) {
    return (
      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{t.orders.shipmentsTitle}</CardTitle>
            <CardDescription>{t.orders.shipmentSummaryDescription}</CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSyncShipment()}
            disabled={isSyncing}
          >
            <RefreshCcw className={cn('mr-2 h-4 w-4', isSyncing ? 'animate-spin' : undefined)} />
            {isSyncing ? t.orders.syncingShipment : t.orders.syncShipment}
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {t.orders.trackingNumber}
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {shipment.trackingNumber ?? shipment.externalRef ?? t.common.notSet}
                </p>
              </div>
              <OrderStatusBadge
                statusCode={shipment.deliveryStatusCode}
                label={getDeliveryStatusLabel(
                  shipment.deliveryStatusCode,
                  shipment.deliveryStatus.name,
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard
              label={t.orders.provider}
              value={getShipmentProviderLabel(shipment.provider)}
            />
            <InfoCard
              label={t.orders.lastSyncedAt}
              value={formatDateTime(shipment.lastSyncedAt)}
            />
            <InfoCard
              label={t.orders.recipient}
              value={buildRecipientValue(shipment)}
            />
            <InfoCard
              label={t.orders.destination}
              value={buildDestinationValue(shipment)}
            />
            <InfoCard
              label={t.orders.declaredValue}
              value={formatCurrency(shipment.declaredValue)}
            />
            <InfoCard
              label={t.orders.cashOnDelivery}
              value={formatCurrency(shipment.cashOnDeliveryAmount)}
            />
            <InfoCard
              label={t.orders.shippingCost}
              value={formatCurrency(shipment.shippingCost)}
            />
            <InfoCard
              label={t.orders.deliveryStatusLabel}
              value={getDeliveryStatusLabel(
                shipment.deliveryStatusCode,
                shipment.deliveryStatus.name,
              )}
            />
          </div>

          {syncError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {syncError}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.orders.shipmentsTitle}</CardTitle>
        <CardDescription>{t.orders.shipmentFormDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-dashed border-border/70 bg-secondary/15 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{t.orders.noShipments}</p>
          <p className="mt-2">{t.orders.shipmentCreateHelp}</p>
        </div>

        <form className="space-y-6" onSubmit={(event) => void onCreateShipment(event)}>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{t.orders.shipmentRefsTitle}</p>
              <p className="text-sm text-muted-foreground">{t.orders.shipmentRefsDescription}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="recipientRef">{t.orders.recipientRef}</Label>
                <Input
                  id="recipientRef"
                  placeholder={t.orders.recipientRefPlaceholder}
                  {...register('recipientRef')}
                />
                <FieldError message={errors.recipientRef?.message} />
              </Field>

              <Field>
                <Label htmlFor="recipientContactRef">{t.orders.recipientContactRef}</Label>
                <Input
                  id="recipientContactRef"
                  placeholder={t.orders.recipientContactRefPlaceholder}
                  {...register('recipientContactRef')}
                />
                <FieldError message={errors.recipientContactRef?.message} />
              </Field>

              <Field>
                <Label htmlFor="recipientCityRef">{t.orders.recipientCityRef}</Label>
                <Input
                  id="recipientCityRef"
                  placeholder={t.orders.recipientCityRefPlaceholder}
                  {...register('recipientCityRef')}
                />
                <FieldError message={errors.recipientCityRef?.message} />
              </Field>

              <Field>
                <Label htmlFor="recipientWarehouseRef">{t.orders.recipientWarehouseRef}</Label>
                <Input
                  id="recipientWarehouseRef"
                  placeholder={t.orders.recipientWarehouseRefPlaceholder}
                  {...register('recipientWarehouseRef')}
                />
                <FieldError message={errors.recipientWarehouseRef?.message} />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{t.orders.shipmentRecipientTitle}</p>
              <p className="text-sm text-muted-foreground">{t.orders.shipmentRecipientDescription}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <Label htmlFor="recipientName">{t.orders.recipientName}</Label>
                <Input id="recipientName" {...register('recipientName')} />
                <FieldError message={errors.recipientName?.message} />
              </Field>

              <Field>
                <Label htmlFor="recipientPhone">{t.orders.recipientPhone}</Label>
                <Input id="recipientPhone" {...register('recipientPhone')} />
                <FieldError message={errors.recipientPhone?.message} />
              </Field>

              <Field>
                <Label htmlFor="destinationCity">{t.orders.destinationCityLabel}</Label>
                <Input id="destinationCity" {...register('destinationCity')} />
                <FieldError message={errors.destinationCity?.message} />
              </Field>

              <Field>
                <Label htmlFor="destinationBranch">{t.orders.destinationBranchLabel}</Label>
                <Input id="destinationBranch" {...register('destinationBranch')} />
                <FieldError message={errors.destinationBranch?.message} />
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">{t.orders.shipmentDetailsTitle}</p>
              <p className="text-sm text-muted-foreground">{t.orders.shipmentDetailsDescription}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field className="xl:col-span-3">
                <Label htmlFor="cargoDescription">{t.orders.cargoDescription}</Label>
                <Input
                  id="cargoDescription"
                  placeholder={t.orders.cargoDescriptionPlaceholder}
                  {...register('cargoDescription')}
                />
                <FieldError message={errors.cargoDescription?.message} />
              </Field>

              <Field>
                <Label htmlFor="declaredValue">{t.orders.declaredValue}</Label>
                <Input
                  id="declaredValue"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('declaredValue')}
                />
                <FieldError message={errors.declaredValue?.message} />
              </Field>

              <Field>
                <Label htmlFor="cashOnDeliveryAmount">{t.orders.cashOnDelivery}</Label>
                <Input
                  id="cashOnDeliveryAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('cashOnDeliveryAmount')}
                />
                <FieldError message={errors.cashOnDeliveryAmount?.message} />
              </Field>

              <Field>
                <Label htmlFor="shippingCost">{t.orders.shippingCost}</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('shippingCost')}
                />
                <FieldError message={errors.shippingCost?.message} />
              </Field>

              <Field>
                <Label htmlFor="weight">{t.orders.weight}</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
                  min="0.001"
                  {...register('weight')}
                />
                <FieldError message={errors.weight?.message} />
              </Field>

              <Field>
                <Label htmlFor="seatsAmount">{t.orders.seatsAmount}</Label>
                <Input
                  id="seatsAmount"
                  type="number"
                  step="1"
                  min="1"
                  {...register('seatsAmount')}
                />
                <FieldError message={errors.seatsAmount?.message} />
              </Field>
            </div>
          </div>

          {submitError ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            <Truck className="mr-2 h-4 w-4" />
            {isSubmitting ? t.orders.creatingShipment : t.orders.createShipment}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-foreground">{value}</p>
    </div>
  );
}

function buildRecipientValue(shipment: OrderShipmentDetail) {
  const parts = [shipment.recipientName, shipment.recipientPhone].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : t.common.notSet;
}

function buildDestinationValue(shipment: OrderShipmentDetail) {
  const parts = [shipment.destinationCity, shipment.destinationBranch].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : t.common.notSet;
}
