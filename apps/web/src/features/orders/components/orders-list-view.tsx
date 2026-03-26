'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, RotateCcw, Search } from 'lucide-react';
import { PageIntro } from '@/components/app-shell/page-intro';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { AppRole } from '@/lib/auth/types';
import { MoveToReturnButton } from '@/features/returns/components/move-to-return-button';
import { ORDER_STATUS_OPTIONS } from '../constants';
import { formatCurrency } from '../format';
import { buildOrdersQueryString } from '../query';
import type {
  OrderListItem,
  OrderManagerOption,
  OrdersListFilters,
  OrdersListResponse,
} from '../types';
import { OrderStatusBadge } from './order-status-badge';

interface OrdersListViewProps {
  role: AppRole;
  filters: OrdersListFilters;
  managers: OrderManagerOption[];
  orders: OrdersListResponse;
}

const columnHelper = createColumnHelper<OrderListItem>();

export function OrdersListView({ role, filters, managers, orders }: OrdersListViewProps) {
  const router = useRouter();
  const columns = [
    columnHelper.accessor('orderNumber', {
      header: t.orders.headers.order,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <Link
            href={`/orders/${row.original.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            {row.original.orderNumber}
          </Link>
        </div>
      ),
    }),
    columnHelper.accessor('customerName', {
      header: t.orders.headers.customer,
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <p className="font-medium text-foreground">{row.original.customerName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.original.customerPhone ?? t.common.noPhone}
          </p>
        </div>
      ),
    }),
    ...(role === 'admin'
      ? [
          columnHelper.display({
            id: 'manager',
            header: t.orders.headers.manager,
            cell: ({ row }) => (
              <div className="min-w-[160px]">
                <p className="font-medium text-foreground">
                  {row.original.manager.firstName} {row.original.manager.lastName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.original.manager.phone ?? t.common.noContactData}
                </p>
              </div>
            ),
          }),
        ]
      : []),
    columnHelper.display({
      id: 'status',
      header: t.orders.headers.status,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <OrderStatusBadge statusCode={row.original.orderStatusCode} />
        </div>
      ),
    }),
    columnHelper.display({
      id: 'totals',
      header: t.orders.headers.totals,
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-foreground">
            {formatCurrency(row.original.totalAmount, row.original.currencyCode)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {`${t.orders.margin} ${formatCurrency(row.original.marginAmount, row.original.currencyCode)}`}
          </p>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: t.orders.headers.actions,
      cell: ({ row }) => (
        <div className="flex min-w-[240px] flex-wrap items-center gap-2">
          <Link
            href={`/orders/${row.original.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {t.common.view}
          </Link>
          <Link
            href={`/orders/${row.original.id}/edit`}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            {t.common.edit}
          </Link>
          <MoveToReturnButton
            orderId={row.original.id}
            orderStatusCode={row.original.orderStatusCode}
            orderReturnCount={row.original.counts.orderReturns}
          />
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: orders.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visiblePages = getVisiblePages(orders.page, orders.pageCount);

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextFilters: Partial<OrdersListFilters> = {
      page: 1,
      limit: parseInteger(formData.get('limit'), filters.limit),
      search: getFormValue(formData, 'search'),
      orderStatusCode: getFormValue(formData, 'orderStatusCode'),
      managerId: role === 'admin' ? getFormValue(formData, 'managerId') : undefined,
    };

    const query = buildOrdersQueryString(nextFilters);
    router.push(`/orders${query ? `?${query}` : ''}`);
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t.orders.pageEyebrow}
        title={t.orders.pageTitle}
        description={t.orders.pageDescription}
      />

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>{t.orders.listTitle}</CardTitle>
            <CardDescription>{t.orders.listDescription}</CardDescription>
          </div>
          <Link href="/orders/new" className={buttonVariants({ size: 'lg' })}>
            <Plus className="mr-2 h-4 w-4" />
            {t.orders.createOrder}
          </Link>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleApplyFilters}>
            <div className="lg:col-span-2">
              <Input
                name="search"
                placeholder={t.orders.searchPlaceholder}
                defaultValue={filters.search ?? ''}
              />
            </div>

            <Select name="orderStatusCode" defaultValue={filters.orderStatusCode ?? ''}>
              <option value="">{t.orders.allStatuses}</option>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>

            {role === 'admin' ? (
              <Select name="managerId" defaultValue={filters.managerId ?? ''}>
                <option value="">{t.orders.allManagers}</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.firstName} {manager.lastName}
                  </option>
                ))}
              </Select>
            ) : null}

            <div className="flex gap-3 lg:col-span-4 lg:justify-between">
              <Select
                name="limit"
                defaultValue={String(filters.limit)}
                className="w-full max-w-[140px]"
              >
                {[10, 20, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {t.common.perPage(value)}
                  </option>
                ))}
              </Select>

              <div className="flex gap-3">
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" />
                  {t.common.applyFilters}
                </Button>
                <Link href="/orders" className={buttonVariants({ variant: 'outline' })}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {t.common.reset}
                </Link>
              </div>
            </div>
          </form>

          <div className="overflow-hidden rounded-3xl border border-border/70">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/35">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={role === 'admin' ? 6 : 5}
                        className="py-12 text-center text-muted-foreground"
                      >
                        {t.orders.noOrdersMatched}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t.common.pageOf(orders.page, orders.pageCount)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildOrdersHref(filters, Math.max(orders.page - 1, 1))}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  orders.page <= 1 && 'pointer-events-none opacity-50',
                )}
              >
                {t.common.previous}
              </Link>

              {visiblePages.map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildOrdersHref(filters, pageNumber)}
                  className={buttonVariants({
                    variant: pageNumber === orders.page ? 'default' : 'outline',
                    size: 'sm',
                  })}
                >
                  {pageNumber}
                </Link>
              ))}

              <Link
                href={buildOrdersHref(filters, Math.min(orders.page + 1, Math.max(orders.pageCount, 1)))}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  (orders.pageCount === 0 || orders.page >= orders.pageCount) &&
                    'pointer-events-none opacity-50',
                )}
              >
                {t.common.next}
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getVisiblePages(currentPage: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= pageCount - 2) {
    return [pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

function buildOrdersHref(filters: OrdersListFilters, page: number) {
  const query = buildOrdersQueryString({
    ...filters,
    page,
  });

  return `/orders${query ? `?${query}` : ''}`;
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseInteger(value: FormDataEntryValue | null, fallback: number) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
