'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, type UseFormRegisterReturn } from 'react-hook-form';
import { PageIntro } from '@/components/app-shell/page-intro';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getRoleLabel, t, translateApiMessage } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { AuthenticatedUser } from '@/lib/auth/types';
import {
  DELIVERY_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../constants';
import { formatCurrency } from '../format';
import {
  buildOrderPayload,
  createEmptyOrderItem,
  orderFormSchema,
  type OrderFormValues,
} from '../schema';
import type { OrderManagerOption } from '../types';

interface OrderFormProps {
  mode: 'create' | 'edit';
  currentUser: AuthenticatedUser;
  managerOptions: OrderManagerOption[];
  initialValues: OrderFormValues;
  orderId?: string;
}

export function OrderForm({
  mode,
  currentUser,
  managerOptions,
  initialValues,
  orderId,
}: OrderFormProps) {
  const router = useRouter();
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialValues,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const shippingCost = watch('shippingCost');
  const currencyCode = watch('currencyCode');
  const preview = getOrderPreview(watchedItems ?? [], shippingCost);
  const isAdmin = currentUser.roleCode === 'admin';

  const onSubmit = handleSubmit(async (values) => {
    setSubmissionError(null);

    const response = await fetch(mode === 'create' ? '/api/orders' : `/api/orders/${orderId}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildOrderPayload(values, currentUser.roleCode)),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string | string[] }
      | null;

    if (!response.ok) {
      setSubmissionError(translateApiMessage(payload?.message, t.orders.saveError));
      return;
    }

    const nextOrderId = payload?.id ?? orderId;

    if (!nextOrderId) {
      setSubmissionError(t.orders.missingOrderId);
      return;
    }

    router.replace(`/orders/${nextOrderId}`);
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={mode === 'create' ? t.orders.createOrder : t.orders.editOrder}
        title={mode === 'create' ? t.orders.createTitle : t.orders.editTitle}
        description={t.orders.formDescription}
      />

      <form className="space-y-6" onSubmit={onSubmit}>
        <input type="hidden" {...register('currencyCode')} />
        <input type="hidden" {...register('internalNote')} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.orders.customerAndRoutingTitle}</CardTitle>
                <CardDescription>{t.orders.customerAndRoutingDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {isAdmin ? (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="managerId">{t.orders.managerLabel}</Label>
                    <Select id="managerId" {...register('managerId')}>
                      <option value="">{t.orders.selectManager}</option>
                      {managerOptions.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.firstName} {manager.lastName}
                        </option>
                      ))}
                    </Select>
                    <FieldError message={errors.managerId?.message} />
                  </div>
                ) : (
                  <div className="md:col-span-2 rounded-2xl border border-border/70 bg-secondary/35 p-4 text-sm text-muted-foreground">
                    {t.orders.assignedManager(currentUser.firstName, currentUser.lastName)} ({getRoleLabel(currentUser.roleCode)})
                  </div>
                )}

                <Field>
                  <Label htmlFor="customerName">{t.orders.customerName}</Label>
                  <Input id="customerName" {...register('customerName')} />
                  <FieldError message={errors.customerName?.message} />
                </Field>

                <Field>
                  <Label htmlFor="customerPhone">{t.orders.primaryPhone}</Label>
                  <Input id="customerPhone" {...register('customerPhone')} />
                  <FieldError message={errors.customerPhone?.message} />
                </Field>

                <div className="md:col-span-2 rounded-2xl border border-border/70 bg-white/80 px-4 py-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      {...register('isProblematic')}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {t.orders.markProblematic}
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.orders.deliveryAndPaymentTitle}</CardTitle>
                <CardDescription>{t.orders.deliveryAndPaymentDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <SelectField
                  id="deliveryMethod"
                  label={t.orders.deliveryMethod}
                  registration={register('deliveryMethod')}
                  options={DELIVERY_METHOD_OPTIONS}
                  error={errors.deliveryMethod?.message}
                  placeholder={t.orders.selectDeliveryMethod}
                />

                <SelectField
                  id="paymentStatusCode"
                  label={t.orders.paymentStatus}
                  registration={register('paymentStatusCode')}
                  options={PAYMENT_STATUS_OPTIONS}
                  error={errors.paymentStatusCode?.message}
                  placeholder={t.orders.selectPaymentStatus}
                />

                <Field>
                  <Label htmlFor="city">{t.orders.city}</Label>
                  <Input id="city" {...register('city')} />
                  <FieldError message={errors.city?.message} />
                </Field>

                <Field>
                  <Label htmlFor="deliveryPoint">{t.orders.deliveryPoint}</Label>
                  <Input id="deliveryPoint" {...register('deliveryPoint')} />
                  <FieldError message={errors.deliveryPoint?.message} />
                </Field>

                <Field>
                  <Label htmlFor="shippingCost">{t.orders.shippingCost}</Label>
                  <Input
                    id="shippingCost"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('shippingCost', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.shippingCost?.message} />
                </Field>

                <Field>
                  <Label htmlFor="prepaymentAmount">{t.orders.prepayment}</Label>
                  <Input
                    id="prepaymentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('prepaymentAmount', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.prepaymentAmount?.message} />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>{t.orders.orderItemsTitle}</CardTitle>
                  <CardDescription>{t.orders.orderItemsDescription}</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={() => append(createEmptyOrderItem())}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t.orders.addItem}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => {
                  const item = watchedItems?.[index];
                  const lineTotal =
                    Math.max(
                      0,
                      toNumber(item?.salePrice) * toNumber(item?.quantity) -
                        toNumber(item?.discountAmount),
                    );

                  return (
                    <div key={field.id} className="rounded-3xl border border-border/70 bg-secondary/20 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{t.orders.itemLabel(index + 1)}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.orders.lineTotal(formatCurrency(lineTotal, currencyCode || 'UAH'))}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t.common.remove}
                        </Button>
                      </div>

                      <input
                        type="hidden"
                        {...register(`items.${index}.purchasePrice`, { valueAsNumber: true })}
                      />
                      <input
                        type="hidden"
                        {...register(`items.${index}.discountAmount`, { valueAsNumber: true })}
                      />

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field className="xl:col-span-2">
                          <Label htmlFor={`items.${index}.productName`}>{t.orders.productName}</Label>
                          <Input id={`items.${index}.productName`} {...register(`items.${index}.productName`)} />
                          <FieldError message={errors.items?.[index]?.productName?.message} />
                        </Field>

                        <Field className="xl:col-span-2">
                          <Label htmlFor={`items.${index}.purchaseLink`}>{t.orders.purchaseLink}</Label>
                          <Input
                            id={`items.${index}.purchaseLink`}
                            type="url"
                            placeholder={t.orders.purchaseLinkPlaceholder}
                            {...register(`items.${index}.purchaseLink`)}
                          />
                          <FieldError message={errors.items?.[index]?.purchaseLink?.message} />
                        </Field>

                        <Field>
                          <Label htmlFor={`items.${index}.sku`}>{t.orders.headers.sku}</Label>
                          <Input id={`items.${index}.sku`} {...register(`items.${index}.sku`)} />
                          <FieldError message={errors.items?.[index]?.sku?.message} />
                        </Field>

                        <Field>
                          <Label htmlFor={`items.${index}.quantity`}>{t.orders.quantity}</Label>
                          <Input
                            id={`items.${index}.quantity`}
                            type="number"
                            min="1"
                            step="1"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                          />
                          <FieldError message={errors.items?.[index]?.quantity?.message} />
                        </Field>

                        <Field>
                          <Label htmlFor={`items.${index}.salePrice`}>{t.orders.salePrice}</Label>
                          <Input
                            id={`items.${index}.salePrice`}
                            type="number"
                            min="0"
                            step="0.01"
                            {...register(`items.${index}.salePrice`, { valueAsNumber: true })}
                          />
                          <FieldError message={errors.items?.[index]?.salePrice?.message} />
                        </Field>
                      </div>
                    </div>
                  );
                })}

                {typeof errors.items?.message === 'string' ? (
                  <FieldError message={errors.items.message} />
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.orders.notesTitle}</CardTitle>
                <CardDescription>{t.orders.notesDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <Field>
                  <Label htmlFor="comment">{t.orders.comment}</Label>
                  <Textarea id="comment" {...register('comment')} />
                  <FieldError message={errors.comment?.message} />
                </Field>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="xl:sticky xl:top-24">
              <CardHeader>
                <CardTitle>{t.orders.liveTotalsTitle}</CardTitle>
                <CardDescription>{t.orders.liveTotalsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PreviewRow label={t.orders.subtotal} value={formatCurrency(preview.subtotal, currencyCode || 'UAH')} />
                <PreviewRow label={t.orders.saleAmount} value={formatCurrency(preview.saleAmount, currencyCode || 'UAH')} />
                <PreviewRow label={t.orders.shippingCost} value={formatCurrency(preview.shippingCost, currencyCode || 'UAH')} />
                <PreviewRow
                  label={t.orders.grandTotal}
                  value={formatCurrency(preview.totalAmount, currencyCode || 'UAH')}
                  className="border-t border-border/70 pt-4 text-base font-semibold"
                />
                <PreviewRow
                  label={t.orders.margin}
                  value={formatCurrency(preview.marginAmount, currencyCode || 'UAH')}
                  className={cn(
                    'text-base font-semibold',
                    preview.marginAmount < 0 ? 'text-red-600' : 'text-emerald-700',
                  )}
                />
              </CardContent>
            </Card>

            {submissionError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submissionError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === 'create'
                    ? t.orders.creating
                    : t.orders.saving
                  : mode === 'create'
                    ? t.orders.createSubmit
                    : t.orders.saveSubmit}
              </Button>

              <Link
                href={mode === 'create' ? '/orders' : `/orders/${orderId}`}
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                {t.common.cancel}
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
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

function SelectField({
  id,
  label,
  registration,
  options,
  error,
  placeholder,
}: {
  id: string;
  label: string;
  registration: UseFormRegisterReturn;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
  placeholder: string;
}) {
  return (
    <Field>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} {...registration}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <FieldError message={error} />
    </Field>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-red-600">{message}</p>;
}

function PreviewRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 text-sm', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function getOrderPreview(items: OrderFormValues['items'], shippingCostInput: number) {
  let purchaseAmount = 0;
  let subtotal = 0;
  let discountTotal = 0;

  for (const item of items) {
    const quantity = toNumber(item.quantity);
    const purchasePrice = toNumber(item.purchasePrice);
    const salePrice = toNumber(item.salePrice);
    const discountAmount = toNumber(item.discountAmount);

    purchaseAmount += purchasePrice * quantity;
    subtotal += salePrice * quantity;
    discountTotal += discountAmount;
  }

  const shippingCost = toNumber(shippingCostInput);
  const saleAmount = subtotal - discountTotal;
  const totalAmount = saleAmount + shippingCost;
  const marginAmount = saleAmount - purchaseAmount - shippingCost;

  return {
    purchaseAmount,
    subtotal,
    discountTotal,
    saleAmount,
    totalAmount,
    marginAmount,
    shippingCost,
  };
}

function toNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}
