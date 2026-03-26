import type { ReactNode } from 'react';
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
import { requireSession } from '@/lib/auth/session';
import {
  getDeliveryMethodLabel,
  getPaymentStatusLabel,
  t,
} from '@/lib/i18n';
import { formatCurrency } from '@/features/orders/format';
import { fetchOrderById, fetchOrderShipment } from '@/features/orders/server';
import { OrderShipmentSection } from '@/features/orders/components/order-shipment-section';
import { OrderStatusBadge } from '@/features/orders/components/order-status-badge';
import { MoveToReturnButton } from '@/features/returns/components/move-to-return-button';

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  await requireSession();
  const { id } = await params;
  const order = await fetchOrderById(id);

  if (!order) {
    notFound();
  }

  const shipment = await fetchOrderShipment(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageIntro
          eyebrow={t.orders.detailsEyebrow}
          title={order.orderNumber}
          description={t.orders.detailsDescription(
            order.customerName,
            order.items.length,
            shipment ? 1 : 0,
          )}
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/orders" className={buttonVariants({ variant: 'outline' })}>
            {t.orders.backToOrders}
          </Link>
          <MoveToReturnButton
            orderId={order.id}
            orderStatusCode={order.orderStatusCode}
            orderReturnCount={order.counts.orderReturns}
            variant="outline"
            size="lg"
          />
          <Link href={`/orders/${order.id}/edit`} className={buttonVariants({ size: 'lg' })}>
            {t.orders.editOrder}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SummaryCard
          title={t.orders.workflow}
          value={<OrderStatusBadge statusCode={order.orderStatusCode} />}
          hint={getPaymentStatusLabel(order.paymentStatusCode, order.paymentStatus.name)}
        />
        <SummaryCard
          title={t.orders.grandTotal}
          value={formatCurrency(order.totalAmount, order.currencyCode)}
          hint={`${t.orders.margin} ${formatCurrency(order.marginAmount, order.currencyCode)}`}
        />
        <SummaryCard
          title={t.orders.managerLabel}
          value={`${order.manager.firstName} ${order.manager.lastName}`}
          hint={order.manager.phone ?? t.common.noContactData}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.orders.itemsTitle}</CardTitle>
              <CardDescription>{t.orders.itemsDescription}</CardDescription>
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
                    {order.items.map((item) => (
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
                        <TableCell>{formatCurrency(item.salePrice, order.currencyCode)}</TableCell>
                        <TableCell>{formatCurrency(item.lineTotal, order.currencyCode)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.orders.notesTitle}</CardTitle>
              <CardDescription>{t.orders.notesDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoBlock label={t.orders.comment} value={order.notes ?? t.orders.noCustomerComment} />
            </CardContent>
          </Card>

          {order.counts.orderReturns > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t.orders.returnsWorkflowTitle}</CardTitle>
                <CardDescription>{t.orders.returnsWorkflowDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.orders.linkedReturnRecords(order.counts.orderReturns)}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.orders.customerAndDeliveryTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label={t.common.customer} value={order.customerName} />
              <InfoRow label={t.orders.primaryPhone} value={order.customerPhone ?? t.common.notSet} />
              <InfoRow label={t.orders.city} value={order.city ?? t.common.notSet} />
              <InfoRow label={t.orders.deliveryPoint} value={order.deliveryPoint ?? t.common.notSet} />
              <InfoRow label={t.orders.deliveryMethod} value={getDeliveryMethodLabel(order.deliveryMethod)} />
              <InfoRow label={t.orders.paymentStatus} value={getPaymentStatusLabel(order.paymentStatusCode, order.paymentStatus.name)} />
              {order.cancelReason ? <InfoRow label={t.orders.cancelReason} value={order.cancelReason} /> : null}
              <InfoRow label={t.orders.problematic} value={order.isProblematic ? t.common.yes : t.common.no} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.orders.totalsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label={t.orders.subtotal} value={formatCurrency(order.subtotal, order.currencyCode)} />
              <InfoRow label={t.orders.saleAmount} value={formatCurrency(order.saleAmount, order.currencyCode)} />
              <InfoRow label={t.orders.shippingCost} value={formatCurrency(order.shippingCost, order.currencyCode)} />
              <InfoRow label={t.orders.prepayment} value={formatCurrency(order.prepaymentAmount, order.currencyCode)} />
              <InfoRow label={t.orders.grandTotal} value={formatCurrency(order.totalAmount, order.currencyCode)} />
              <InfoRow label={t.orders.margin} value={formatCurrency(order.marginAmount, order.currencyCode)} />
            </CardContent>
          </Card>

          <OrderShipmentSection order={order} shipment={shipment} />
        </div>
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
