'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PencilLine } from 'lucide-react';
import { PageIntro } from '@/components/app-shell/page-intro';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDateTime } from '@/features/orders/format';
import type { OrderManagerOption } from '@/features/orders/types';
import {
  getFinanceCategoryLabel,
  getFinanceDirectionLabel,
  getManagerPayoutStatusLabel,
  t,
  translateApiMessage,
} from '@/lib/i18n';
import { FINANCE_CATEGORY_OPTIONS } from '../constants';
import type {
  AdminFinanceSummary,
  FinancePayoutsResponse,
  FinanceTransactionsResponse,
  FinanceTransactionItem,
} from '../types';
import { AdminExpenseBreakdownChart, AdminIncomeExpenseChart } from './finance-charts';

interface AdminFinanceViewProps {
  summary: AdminFinanceSummary;
  transactions: FinanceTransactionsResponse;
  payouts: FinancePayoutsResponse;
  managers: OrderManagerOption[];
}

type TransactionFormState = {
  categoryCode: string;
  managerId: string;
  orderId: string;
  orderReturnId: string;
  amount: string;
  currencyCode: string;
  reference: string;
  description: string;
  occurredAt: string;
};

const EMPTY_TRANSACTION_FORM: TransactionFormState = {
  categoryCode: 'sale_income',
  managerId: '',
  orderId: '',
  orderReturnId: '',
  amount: '',
  currencyCode: 'UAH',
  reference: '',
  description: '',
  occurredAt: '',
};

export function AdminFinanceView({
  summary,
  transactions,
  payouts,
  managers,
}: AdminFinanceViewProps) {
  const router = useRouter();
  const [editingTransactionId, setEditingTransactionId] = React.useState<string | null>(null);
  const [transactionForm, setTransactionForm] = React.useState<TransactionFormState>(
    EMPTY_TRANSACTION_FORM,
  );
  const [transactionError, setTransactionError] = React.useState<string | null>(null);
  const [transactionSubmitting, setTransactionSubmitting] = React.useState(false);

  const [payoutManagerId, setPayoutManagerId] = React.useState('');
  const [payoutAmount, setPayoutAmount] = React.useState('');
  const [payoutError, setPayoutError] = React.useState<string | null>(null);
  const [payoutSubmitting, setPayoutSubmitting] = React.useState(false);

  const handleEditTransaction = (transaction: FinanceTransactionItem) => {
    setEditingTransactionId(transaction.id);
    setTransactionForm({
      categoryCode: transaction.categoryCode,
      managerId: transaction.managerId ?? '',
      orderId: transaction.orderId ?? '',
      orderReturnId: transaction.orderReturnId ?? '',
      amount: transaction.amount,
      currencyCode: transaction.currencyCode,
      reference: transaction.reference ?? '',
      description: transaction.description ?? '',
      occurredAt: toDateTimeLocalValue(transaction.occurredAt),
    });
    setTransactionError(null);
  };

  const resetTransactionForm = () => {
    setEditingTransactionId(null);
    setTransactionForm(EMPTY_TRANSACTION_FORM);
    setTransactionError(null);
  };

  const handleTransactionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTransactionSubmitting(true);
    setTransactionError(null);

    try {
      const endpoint = editingTransactionId
        ? `/api/finance/transactions/${editingTransactionId}`
        : '/api/finance/transactions';

      const requestInit: RequestInit = {
        method: editingTransactionId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryCode: transactionForm.categoryCode,
          managerId: transactionForm.managerId || undefined,
          orderId: transactionForm.orderId || undefined,
          orderReturnId: transactionForm.orderReturnId || undefined,
          amount: Number(transactionForm.amount),
          currencyCode: transactionForm.currencyCode || undefined,
          reference: transactionForm.reference || undefined,
          description: transactionForm.description || undefined,
          occurredAt: transactionForm.occurredAt || undefined,
        }),
      };

      const response = await fetch(endpoint, requestInit);

      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        setTransactionError(
          translateApiMessage(payload?.message, t.finance.admin.transactionSaveError),
        );
        return;
      }

      resetTransactionForm();
      router.refresh();
    } catch {
      setTransactionError(t.finance.admin.transactionSaveError);
    } finally {
      setTransactionSubmitting(false);
    }
  };

  const handlePayoutSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPayoutSubmitting(true);
    setPayoutError(null);

    try {
      const response = await fetch('/api/finance/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          managerId: payoutManagerId,
          amount: Number(payoutAmount),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        setPayoutError(translateApiMessage(payload?.message, t.finance.admin.payoutCreateError));
        return;
      }

      setPayoutManagerId('');
      setPayoutAmount('');
      router.refresh();
    } catch {
      setPayoutError(t.finance.admin.payoutCreateError);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t.finance.admin.eyebrow}
        title={t.finance.admin.title}
        description={t.finance.admin.description}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={t.finance.admin.totalIncome}
          value={formatCurrency(summary.totalIncome, summary.currencyCode)}
          hint={t.finance.admin.saleIncomeHint(
            formatCurrency(summary.categories.saleIncome, summary.currencyCode),
          )}
        />
        <SummaryCard
          label={t.finance.admin.totalExpense}
          value={formatCurrency(summary.totalExpense, summary.currencyCode)}
          hint={t.finance.admin.returnsLossHint(
            formatCurrency(summary.categories.returnsLoss, summary.currencyCode),
          )}
        />
        <SummaryCard
          label={t.finance.admin.paidPayouts}
          value={formatCurrency(summary.paidPayouts, summary.currencyCode)}
          hint={t.finance.admin.paidPayoutsHint}
        />
        <SummaryCard
          label={t.finance.admin.netCashflow}
          value={formatCurrency(summary.netCashflow, summary.currencyCode)}
          hint={t.finance.admin.netCashflowHint}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.finance.admin.incomeExpenseTitle}</CardTitle>
            <CardDescription>{t.finance.admin.incomeExpenseDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminIncomeExpenseChart data={summary.charts.monthlyCashflow} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.finance.admin.expenseBreakdownTitle}</CardTitle>
            <CardDescription>{t.finance.admin.expenseBreakdownDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminExpenseBreakdownChart data={summary.charts.expenseByCategory} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card>
          <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>{t.finance.admin.transactionsTitle}</CardTitle>
              <CardDescription>{t.finance.admin.transactionsDescription}</CardDescription>
            </div>
            <span className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              {t.finance.admin.transactionsTotal(transactions.total)}
            </span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-3xl border border-border/70">
              <Table>
                <TableHeader className="bg-secondary/35">
                  <TableRow>
                    <TableHead>{t.finance.admin.headers.category}</TableHead>
                    <TableHead>{t.finance.admin.headers.linkedRefs}</TableHead>
                    <TableHead>{t.finance.admin.headers.manager}</TableHead>
                    <TableHead>{t.finance.admin.headers.amount}</TableHead>
                    <TableHead>{t.finance.admin.headers.action}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.items.length > 0 ? (
                    transactions.items.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <p className="font-medium">
                            {getFinanceCategoryLabel(transaction.categoryCode)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getFinanceDirectionLabel(transaction.category.direction)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{transaction.order?.orderNumber ?? t.common.noOrder}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {transaction.orderReturn?.returnNumber ?? t.common.noReturn}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.manager
                            ? `${transaction.manager.firstName} ${transaction.manager.lastName}`
                            : t.common.noManager}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(transaction.amount, transaction.currencyCode)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTransaction(transaction)}
                          >
                            <PencilLine className="mr-2 h-4 w-4" />
                            {t.common.edit}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        {t.finance.admin.noTransactionsYet}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingTransactionId
                  ? t.finance.admin.editTransactionTitle
                  : t.finance.admin.newTransactionTitle}
              </CardTitle>
              <CardDescription>{t.finance.admin.transactionFormDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleTransactionSubmit}>
                <Field>
                  <Label htmlFor="categoryCode">{t.finance.fields.category}</Label>
                  <Select
                    id="categoryCode"
                    value={transactionForm.categoryCode}
                    onChange={(event) =>
                      setTransactionForm((current) => ({
                        ...current,
                        categoryCode: event.target.value,
                      }))
                    }
                  >
                    {FINANCE_CATEGORY_OPTIONS.map((category) => (
                      <option key={category.code} value={category.code}>
                        {category.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field>
                  <Label htmlFor="transactionManagerId">{t.finance.fields.manager}</Label>
                  <Select
                    id="transactionManagerId"
                    value={transactionForm.managerId}
                    onChange={(event) =>
                      setTransactionForm((current) => ({
                        ...current,
                        managerId: event.target.value,
                      }))
                    }
                  >
                    <option value="">{t.finance.admin.noManagerLink}</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="transactionAmount">{t.finance.fields.amount}</Label>
                  <Input
                    id="transactionAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={transactionForm.amount}
                    onChange={(event) =>
                      setTransactionForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                  />
                </Field>

                <Field>
                  <Label htmlFor="transactionDescription">
                    {t.finance.admin.descriptionLabel}
                  </Label>
                  <Textarea
                    id="transactionDescription"
                    value={transactionForm.description}
                    onChange={(event) =>
                      setTransactionForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </Field>

                {transactionError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {transactionError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={transactionSubmitting}>
                    {transactionSubmitting
                      ? editingTransactionId
                        ? t.finance.admin.transactionSubmittingEdit
                        : t.finance.admin.transactionSubmittingCreate
                      : editingTransactionId
                        ? t.finance.admin.saveTransaction
                        : t.finance.admin.createTransaction}
                  </Button>
                  {editingTransactionId ? (
                    <Button type="button" variant="outline" onClick={resetTransactionForm}>
                      {t.finance.admin.cancelEdit}
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.finance.admin.createPayoutTitle}</CardTitle>
              <CardDescription>{t.finance.admin.createPayoutDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePayoutSubmit}>
                <Field>
                  <Label htmlFor="payoutManagerId">{t.finance.fields.manager}</Label>
                  <Select
                    id="payoutManagerId"
                    value={payoutManagerId}
                    onChange={(event) => setPayoutManagerId(event.target.value)}
                  >
                    <option value="">{t.finance.admin.selectManager}</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field>
                  <Label htmlFor="payoutAmount">{t.finance.fields.amount}</Label>
                  <Input
                    id="payoutAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={payoutAmount}
                    onChange={(event) => setPayoutAmount(event.target.value)}
                  />
                </Field>

                {payoutError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {payoutError}
                  </div>
                ) : null}

                <Button type="submit" disabled={payoutSubmitting}>
                  {payoutSubmitting
                    ? t.finance.admin.creatingPayout
                    : t.finance.admin.createPayout}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.finance.admin.payoutHistoryTitle}</CardTitle>
          <CardDescription>{t.finance.admin.payoutHistoryDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-3xl border border-border/70">
            <Table>
              <TableHeader className="bg-secondary/35">
                <TableRow>
                  <TableHead>{t.finance.admin.headers.manager}</TableHead>
                  <TableHead>{t.finance.admin.headers.amount}</TableHead>
                  <TableHead>{t.common.status}</TableHead>
                  <TableHead>{t.finance.admin.headers.paid}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.items.length > 0 ? (
                  payouts.items.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        {payout.manager
                          ? `${payout.manager.firstName} ${payout.manager.lastName}`
                          : t.common.noManager}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payout.amount, payout.currencyCode)}
                      </TableCell>
                      <TableCell>{getManagerPayoutStatusLabel(payout.status)}</TableCell>
                      <TableCell>
                        {payout.paidAt ? formatDateTime(payout.paidAt) : t.common.notSet}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                      {t.finance.admin.noPayoutsYet}
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
          <CardTitle>{t.finance.admin.categorySnapshotTitle}</CardTitle>
          <CardDescription>{t.finance.admin.categorySnapshotDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['returns_loss', summary.categories.returnsLoss],
            ['advertising', summary.categories.advertising],
            ['taxes', summary.categories.taxes],
            ['garage', summary.categories.garage],
            ['logistics', summary.categories.logistics],
            ['other_expense', summary.categories.otherExpense],
            ['manual_income_adjustment', summary.categories.manualIncomeAdjustment],
            ['manual_expense_adjustment', summary.categories.manualExpenseAdjustment],
          ].map(([code, value]) => (
            <div key={code} className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {getFinanceCategoryLabel(code)}
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {formatCurrency(value, summary.currencyCode)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-4 text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
