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
import { RotateCcw, Search } from 'lucide-react';
import { PageIntro } from '@/components/app-shell/page-intro';
import { buttonVariants, Button } from '@/components/ui/button';
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
import { formatCurrency } from '@/features/orders/format';
import type { OrderManagerOption } from '@/features/orders/types';
import type { AppRole } from '@/lib/auth/types';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { RETURN_STATUS_OPTIONS } from '../constants';
import { buildReturnsQueryString } from '../query';
import type {
  OrderReturnListItem,
  ReturnsListFilters,
  ReturnsListResponse,
} from '../types';
import { ReturnStatusBadge } from './return-status-badge';

interface ReturnsListViewProps {
  role: AppRole;
  filters: ReturnsListFilters;
  managers: OrderManagerOption[];
  returnsData: ReturnsListResponse;
}

const columnHelper = createColumnHelper<OrderReturnListItem>();

export function ReturnsListView({
  role,
  filters,
  managers,
  returnsData,
}: ReturnsListViewProps) {
  const router = useRouter();
  const columns = [
    columnHelper.accessor('returnNumber', {
      header: t.returns.headers.return,
      cell: ({ row }) => (
        <div className="min-w-[180px]">
          <Link
            href={`/returns/${row.original.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            {row.original.returnNumber}
          </Link>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'order',
      header: t.returns.headers.orderCustomer,
      cell: ({ row }) => (
        <div className="min-w-[220px]">
          <Link
            href={`/orders/${row.original.order.id}`}
            className="font-medium text-foreground hover:text-primary"
          >
            {row.original.order.orderNumber}
          </Link>
          <p className="mt-1 text-sm text-foreground">{row.original.order.customerName}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.original.order.customerPhone ?? t.common.noPhone}
          </p>
        </div>
      ),
    }),
    ...(role === 'admin'
      ? [
          columnHelper.display({
            id: 'manager',
            header: t.returns.headers.manager,
            cell: ({ row }) => (
              <div className="min-w-[160px]">
                <p className="font-medium text-foreground">
                  {row.original.order.manager.firstName} {row.original.order.manager.lastName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.original.order.manager.phone ?? t.common.noContactData}
                </p>
              </div>
            ),
          }),
        ]
      : []),
    columnHelper.display({
      id: 'status',
      header: t.returns.headers.status,
      cell: ({ row }) => (
        <div className="min-w-[180px] space-y-2">
          <ReturnStatusBadge statusCode={row.original.returnStatusCode} />
          <p className="text-xs text-muted-foreground">
            {row.original.processedBy
              ? t.common.processedBy(`${row.original.processedBy.firstName} ${row.original.processedBy.lastName}`)
              : t.returns.awaitingOperatorAction}
          </p>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'amount',
      header: t.returns.headers.amount,
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="font-semibold text-foreground">
            {formatCurrency(row.original.amount, row.original.order.currencyCode)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.returns.orderTotal(formatCurrency(row.original.order.totalAmount, row.original.order.currencyCode))}
          </p>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: t.returns.headers.actions,
      cell: ({ row }) => (
        <Link
          href={`/returns/${row.original.id}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {t.common.view}
        </Link>
      ),
    }),
  ];

  const table = useReactTable({
    data: returnsData.items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const visiblePages = getVisiblePages(returnsData.page, returnsData.pageCount);

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextFilters: Partial<ReturnsListFilters> = {
      page: 1,
      limit: parseInteger(formData.get('limit'), filters.limit),
      search: getFormValue(formData, 'search'),
      returnStatusCode: getFormValue(formData, 'returnStatusCode'),
      managerId: role === 'admin' ? getFormValue(formData, 'managerId') : undefined,
    };

    const query = buildReturnsQueryString(nextFilters);
    router.push(`/returns${query ? `?${query}` : ''}`);
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={t.returns.pageEyebrow}
        title={t.returns.pageTitle}
        description={t.returns.pageDescription}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t.returns.listTitle}</CardTitle>
          <CardDescription>{t.returns.listDescription}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form className="grid gap-3 lg:grid-cols-4" onSubmit={handleApplyFilters}>
            <div className="lg:col-span-2">
              <Input
                name="search"
                placeholder={t.returns.searchPlaceholder}
                defaultValue={filters.search ?? ''}
              />
            </div>

            <Select name="returnStatusCode" defaultValue={filters.returnStatusCode ?? ''}>
              <option value="">{t.returns.allStatuses}</option>
              {RETURN_STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>

            {role === 'admin' ? (
              <Select name="managerId" defaultValue={filters.managerId ?? ''}>
                <option value="">{t.returns.allManagers}</option>
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
                <Link href="/returns" className={buttonVariants({ variant: 'outline' })}>
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
                        {t.returns.noReturnsMatched}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {t.common.pageOf(returnsData.page, returnsData.pageCount)}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildReturnsHref(filters, Math.max(returnsData.page - 1, 1))}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  returnsData.page <= 1 && 'pointer-events-none opacity-50',
                )}
              >
                {t.common.previous}
              </Link>

              {visiblePages.map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildReturnsHref(filters, pageNumber)}
                  className={buttonVariants({
                    variant: pageNumber === returnsData.page ? 'default' : 'outline',
                    size: 'sm',
                  })}
                >
                  {pageNumber}
                </Link>
              ))}

              <Link
                href={buildReturnsHref(
                  filters,
                  Math.min(returnsData.page + 1, Math.max(returnsData.pageCount, 1)),
                )}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  (returnsData.pageCount === 0 || returnsData.page >= returnsData.pageCount) &&
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

function buildReturnsHref(filters: ReturnsListFilters, page: number) {
  const query = buildReturnsQueryString({
    ...filters,
    page,
  });

  return `/returns${query ? `?${query}` : ''}`;
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
