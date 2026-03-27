import type { ReactNode } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageIntro } from '@/components/app-shell/page-intro';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDateTime } from '@/features/orders/format';
import { ReturnActionsPanel } from '@/features/returns/components/return-actions-panel';
import { ReturnStatusBadge } from '@/features/returns/components/return-status-badge';
import { fetchReturnById } from '@/features/returns/server';
import { requireSession } from '@/lib/auth/session';
import { getOrderStatusLabel, t } from '@/lib/i18n';

type ReturnDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReturnDetailsPage({ params }: ReturnDetailsPageProps) {
  await requireSession();
  const { id } = await params;
  const orderReturn = await fetchReturnById(id);

  if (!orderReturn) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageIntro
          eyebrow={t.returns.detailsEyebrow}
          title={orderReturn.returnNumber}
          description={t.returns.detailsDescription(
            orderReturn.order.orderNumber,
            orderReturn.order.customerName,
          )}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/returns" className={buttonVariants({ variant: 'outline' })}>
            {t.returns.backToReturns}
          </Link>
          <Link href={`/orders/${orderReturn.order.id}` as Route} className={buttonVariants({ variant: 'outline' })}>
            {t.returns.openOrder}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SummaryCard
          title={t.returns.returnStatus}
          value={<ReturnStatusBadge statusCode={orderReturn.returnStatusCode} />}
          hint={
            orderReturn.resolvedAt
              ? t.returns.resolvedAt(formatDateTime(orderReturn.resolvedAt))
              : t.returns.stillActive
          }
        />
        <SummaryCard
          title={t.returns.returnAmount}
          value={formatCurrency(orderReturn.amount, orderReturn.order.currencyCode)}
          hint={t.returns.orderTotal(formatCurrency(orderReturn.order.totalAmount, orderReturn.order.currencyCode))}
        />
        <SummaryCard
          title={t.orders.managerLabel}
          value={`${orderReturn.order.manager.firstName} ${orderReturn.order.manager.lastName}`}
          hint={orderReturn.order.manager.phone ?? t.common.noContactData}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.returns.linkedOrderSnapshotTitle}</CardTitle>
              <CardDescription>{t.returns.linkedOrderSnapshotDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <InfoRow label={t.returns.orderNumber} value={orderReturn.order.orderNumber} />
              <InfoRow label={t.returns.orderStatus} value={getOrderStatusLabel(orderReturn.order.orderStatusCode)} />
              <InfoRow label={t.common.customer} value={orderReturn.order.customerName} />
              <InfoRow label={t.orders.primaryPhone} value={orderReturn.order.customerPhone ?? t.common.notSet} />
              <InfoRow label={t.orders.city} value={orderReturn.order.city ?? t.common.notSet} />
              <InfoRow label={t.returns.problematicFlag} value={orderReturn.order.isProblematic ? t.common.yes : t.common.no} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.returns.orderItemsTitle}</CardTitle>
              <CardDescription>{t.returns.orderItemsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-3xl border border-border/70">
                <Table>
                  <TableHeader className="bg-secondary/35">
                    <TableRow>
                      <TableHead>{t.orders.headers.product}</TableHead>
                      <TableHead>{t.orders.headers.purchaseLink}</TableHead>
                      <TableHead>{t.orders.headers.sku}</TableHead>
                      <TableHead>{t.orders.headers.qty}</TableHead>
                      <TableHead>{t.orders.headers.sale}</TableHead>
                      <TableHead>{t.orders.headers.lineTotal}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderReturn.order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell>
                          {item.purchaseLink ? (
                            <a
                              href={item.purchaseLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline underline-offset-4"
                            >
                              {t.orders.openPurchaseLink}
                            </a>
                          ) : (
                            t.common.notSet
                          )}
                        </TableCell>
                        <TableCell>{item.sku ?? t.common.notSet}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{formatCurrency(item.salePrice, orderReturn.order.currencyCode)}</TableCell>
                        <TableCell>{formatCurrency(item.lineTotal, orderReturn.order.currencyCode)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.returns.returnNotesTitle}</CardTitle>
              <CardDescription>{t.returns.returnNotesDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoBlock label={t.returns.reason} value={orderReturn.reason ?? t.returns.noReasonYet} />
            </CardContent>
          </Card>
        </div>

        <ReturnActionsPanel orderReturn={orderReturn} />
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        <div className="mt-4 text-lg font-semibold text-foreground">{value}</div>
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-sm leading-7 text-foreground">{value}</p>
    </div>
  );
}
