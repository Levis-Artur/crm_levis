'use client';

import { PageIntro } from '@/components/app-shell/page-intro';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getManagerPayoutStatusLabel, t } from '@/lib/i18n';
import { formatCurrency, formatDateTime } from '@/features/orders/format';
import type {
  ManagerFinanceEarningsResponse,
  ManagerFinancePayoutsResponse,
  ManagerFinanceSummary,
} from '../types';
import { ManagerEarningsChart } from './finance-charts';

interface ManagerFinanceViewProps {
  summary: ManagerFinanceSummary;
  earnings: ManagerFinanceEarningsResponse;
  payouts: ManagerFinancePayoutsResponse;
}

export function ManagerFinanceView({
  summary,
  earnings,
  payouts,
}: ManagerFinanceViewProps) {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t.finance.manager.eyebrow}
        title={t.finance.manager.title}
        description={t.finance.manager.description}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={t.finance.manager.availableToWithdraw}
          value={formatCurrency(summary.availableToWithdraw, summary.currencyCode)}
          hint={t.finance.manager.completedEarningsMinusPaidPayouts}
        />
        <SummaryCard
          label={t.finance.manager.totalEarnings}
          value={formatCurrency(summary.totalEarnings, summary.currencyCode)}
          hint={t.finance.manager.fullyCompletedOrders(summary.completedOrdersCount)}
        />
        <SummaryCard
          label={t.finance.manager.paidPayouts}
          value={formatCurrency(summary.paidPayouts, summary.currencyCode)}
          hint={t.finance.manager.pendingPayoutsHint(
            formatCurrency(summary.pendingPayouts, summary.currencyCode),
          )}
        />
        <SummaryCard
          label={t.finance.manager.totalMargin}
          value={formatCurrency(summary.totalMargin, summary.currencyCode)}
          hint={
            Number(summary.overpaidAmount) > 0
              ? t.finance.manager.overpaidHint(
                  formatCurrency(summary.overpaidAmount, summary.currencyCode),
                )
              : t.finance.manager.marginHint
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.finance.manager.chartTitle}</CardTitle>
          <CardDescription>{t.finance.manager.chartDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ManagerEarningsChart data={earnings.chart} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t.finance.manager.earningsTableTitle}</CardTitle>
            <CardDescription>{t.finance.manager.earningsTableDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-3xl border border-border/70">
              <Table>
                <TableHeader className="bg-secondary/35">
                  <TableRow>
                    <TableHead>{t.finance.manager.headers.order}</TableHead>
                    <TableHead>{t.finance.manager.headers.customer}</TableHead>
                    <TableHead>{t.finance.manager.headers.sale}</TableHead>
                    <TableHead>{t.finance.manager.headers.margin}</TableHead>
                    <TableHead>{t.finance.manager.headers.earnings}</TableHead>
                    <TableHead>{t.finance.manager.headers.completed}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.items.length > 0 ? (
                    earnings.items.map((item) => (
                      <TableRow key={item.orderId}>
                        <TableCell className="font-medium">{item.orderNumber}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{formatCurrency(item.saleAmount, item.currencyCode)}</TableCell>
                        <TableCell>{formatCurrency(item.margin, item.currencyCode)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(item.managerEarnings, item.currencyCode)}
                        </TableCell>
                        <TableCell>{formatDateTime(item.completedAt)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        {t.finance.manager.noEarningsYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.finance.manager.payoutsHistoryTitle}</CardTitle>
            <CardDescription>{t.finance.manager.payoutsHistoryDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payouts.items.length > 0 ? (
                payouts.items.map((payout) => (
                  <div
                    key={payout.id}
                    className="rounded-2xl border border-border/70 bg-secondary/25 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(payout.amount, payout.currencyCode)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {getManagerPayoutStatusLabel(payout.status)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <p>{payout.paidAt ? formatDateTime(payout.paidAt) : t.common.notSet}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t.finance.manager.noPayoutsYet}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-4 text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
