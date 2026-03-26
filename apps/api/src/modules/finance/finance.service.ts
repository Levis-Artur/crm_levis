import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from '../roles/role-code.enum';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { CreateManagerPayoutDto } from './dto/create-manager-payout.dto';
import { FinanceSummaryQueryDto } from './dto/finance-summary-query.dto';
import { ListFinancePayoutsQueryDto } from './dto/list-finance-payouts-query.dto';
import { ListFinanceTransactionsQueryDto } from './dto/list-finance-transactions-query.dto';
import { ListManagerEarningsQueryDto } from './dto/list-manager-earnings-query.dto';
import { ListManagerPayoutsQueryDto } from './dto/list-manager-payouts-query.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';
import {
  financeTransactionInclude,
  managerPayoutInclude,
  presentFinanceTransaction,
  presentManagerPayout,
} from './presenters/finance.presenter';
import { FinanceDirection, ManagerPayoutStatus } from './finance.enums';
import type { FinanceAuditContext } from './finance.types';

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

const COMPLETED_ORDER_STATUS_CODE = 'fully_completed';
const DEFAULT_CURRENCY_CODE = 'UAH';
const MANAGER_EARNING_RATE = new Decimal('0.3');
const ZERO_DECIMAL = new Decimal(0);

type ManagerCompletedOrderRecord = Prisma.OrderGetPayload<{
  select: {
    id: true;
    orderNumber: true;
    customerName: true;
    currencyCode: true;
    saleAmount: true;
    purchaseAmount: true;
    completedAt: true;
    createdAt: true;
  };
}>;

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getManagerFinanceSummary(currentUser: PresentedUser) {
    const completedOrders = await this.prisma.order.findMany({
      where: this.buildManagerCompletedOrdersWhere(currentUser.id),
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        currencyCode: true,
        saleAmount: true,
        purchaseAmount: true,
        completedAt: true,
        createdAt: true,
      },
    });

    const [paidPayouts, pendingPayouts] = await Promise.all([
      this.sumPayoutsByStatuses(currentUser.id, [ManagerPayoutStatus.PAID]),
      this.sumPayoutsByStatuses(currentUser.id, [
        ManagerPayoutStatus.PENDING,
        ManagerPayoutStatus.APPROVED,
      ]),
    ]);

    const totals = this.buildManagerEarningsTotals(completedOrders);
    const rawAvailable = totals.totalEarnings.sub(paidPayouts);
    const availableToWithdraw = rawAvailable.greaterThanOrEqualTo(ZERO_DECIMAL)
      ? rawAvailable
      : ZERO_DECIMAL;
    const overpaidAmount = rawAvailable.lessThan(ZERO_DECIMAL)
      ? paidPayouts.sub(totals.totalEarnings)
      : ZERO_DECIMAL;

    return {
      currencyCode: DEFAULT_CURRENCY_CODE,
      completedOrdersCount: completedOrders.length,
      totalMargin: totals.totalMargin,
      totalEarnings: totals.totalEarnings,
      paidPayouts,
      pendingPayouts,
      availableToWithdraw,
      overpaidAmount,
    };
  }

  async listManagerEarnings(query: ListManagerEarningsQueryDto, currentUser: PresentedUser) {
    this.assertDateRange(query.completedFrom, query.completedTo, 'completedFrom', 'completedTo');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildManagerCompletedOrdersWhere(currentUser.id, {
      from: query.completedFrom,
      to: query.completedTo,
    });

    const [orders, total, chartOrders] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          currencyCode: true,
          saleAmount: true,
          purchaseAmount: true,
          completedAt: true,
          createdAt: true,
        },
        orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          currencyCode: true,
          saleAmount: true,
          purchaseAmount: true,
          completedAt: true,
          createdAt: true,
        },
        orderBy: [{ completedAt: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);

    return {
      items: orders.map((order) => this.presentManagerEarning(order)),
      total,
      page,
      limit,
      pageCount: total > 0 ? Math.ceil(total / limit) : 0,
      chart: this.buildManagerEarningsChart(chartOrders),
    };
  }

  async listManagerPayouts(query: ListManagerPayoutsQueryDto, currentUser: PresentedUser) {
    this.assertDateRange(query.paidFrom, query.paidTo, 'paidFrom', 'paidTo');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildPayoutWhere({
      managerId: currentUser.id,
      status: query.status,
      paidFrom: query.paidFrom,
      paidTo: query.paidTo,
    });

    const [payouts, total, paidTotal, pendingTotal] = await this.prisma.$transaction([
      this.prisma.managerPayout.findMany({
        where,
        include: managerPayoutInclude,
        orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.managerPayout.count({ where }),
      this.sumPayoutsByStatuses(currentUser.id, [ManagerPayoutStatus.PAID]),
      this.sumPayoutsByStatuses(currentUser.id, [
        ManagerPayoutStatus.PENDING,
        ManagerPayoutStatus.APPROVED,
      ]),
    ]);

    return {
      items: payouts.map((payout) => presentManagerPayout(payout)),
      total,
      page,
      limit,
      pageCount: total > 0 ? Math.ceil(total / limit) : 0,
      paidTotal,
      pendingTotal,
    };
  }

  async getAdminFinanceSummary(query: FinanceSummaryQueryDto) {
    this.assertDateRange(query.from, query.to, 'from', 'to');

    const transactionWhere = this.buildSummaryTransactionWhere(query.from, query.to);
    const payoutWhere = this.buildSummaryPaidPayoutWhere(query.from, query.to);

    const [transactions, paidPayoutsAggregate] = await this.prisma.$transaction([
      this.prisma.financeTransaction.findMany({
        where: transactionWhere,
        select: {
          amount: true,
          occurredAt: true,
          categoryCode: true,
          category: {
            select: {
              code: true,
              name: true,
              direction: true,
            },
          },
        },
        orderBy: [{ occurredAt: 'asc' }],
      }),
      this.prisma.managerPayout.aggregate({
        where: payoutWhere,
        _sum: {
          amount: true,
        },
      }),
    ]);

    let totalIncome = ZERO_DECIMAL;
    let totalExpense = ZERO_DECIMAL;
    const trackedCategoryTotals: Record<string, Prisma.Decimal> = {
      sale_income: ZERO_DECIMAL,
      returns_loss: ZERO_DECIMAL,
      advertising: ZERO_DECIMAL,
      taxes: ZERO_DECIMAL,
      garage: ZERO_DECIMAL,
      logistics: ZERO_DECIMAL,
      other_expense: ZERO_DECIMAL,
      manual_income_adjustment: ZERO_DECIMAL,
      manual_expense_adjustment: ZERO_DECIMAL,
    };
    const monthlyBuckets = new Map<
      string,
      { period: string; income: number; expense: number }
    >();

    for (const transaction of transactions) {
      const amount = new Decimal(transaction.amount);
      const period = this.toMonthKey(transaction.occurredAt);

      if (!monthlyBuckets.has(period)) {
        monthlyBuckets.set(period, { period, income: 0, expense: 0 });
      }

      const bucket = monthlyBuckets.get(period)!;

      if (transaction.category.direction === FinanceDirection.INCOME) {
        totalIncome = totalIncome.add(amount);
        bucket.income += Number(amount);
      } else {
        totalExpense = totalExpense.add(amount);
        bucket.expense += Number(amount);
      }

      if (trackedCategoryTotals[transaction.categoryCode]) {
        trackedCategoryTotals[transaction.categoryCode] =
          trackedCategoryTotals[transaction.categoryCode].add(amount);
      }
    }

    const paidPayouts = paidPayoutsAggregate._sum.amount ?? ZERO_DECIMAL;
    const netCashflow = totalIncome.sub(totalExpense).sub(paidPayouts);

    return {
      currencyCode: DEFAULT_CURRENCY_CODE,
      totalIncome,
      totalExpense,
      paidPayouts,
      netCashflow,
      categories: {
        saleIncome: trackedCategoryTotals.sale_income,
        returnsLoss: trackedCategoryTotals.returns_loss,
        advertising: trackedCategoryTotals.advertising,
        taxes: trackedCategoryTotals.taxes,
        garage: trackedCategoryTotals.garage,
        logistics: trackedCategoryTotals.logistics,
        otherExpense: trackedCategoryTotals.other_expense,
        manualIncomeAdjustment: trackedCategoryTotals.manual_income_adjustment,
        manualExpenseAdjustment: trackedCategoryTotals.manual_expense_adjustment,
      },
      charts: {
        monthlyCashflow: Array.from(monthlyBuckets.values()),
        expenseByCategory: [
          ['returns_loss', 'Returns Loss'],
          ['advertising', 'Advertising'],
          ['taxes', 'Taxes'],
          ['garage', 'Garage'],
          ['logistics', 'Logistics'],
          ['other_expense', 'Other Expense'],
          ['manual_expense_adjustment', 'Manual Expense Adjustment'],
        ]
          .map(([code, label]) => ({
            categoryCode: code,
            label,
            amount: Number(trackedCategoryTotals[code] ?? ZERO_DECIMAL),
          }))
          .filter((item) => item.amount > 0),
      },
    };
  }

  async listFinanceTransactions(query: ListFinanceTransactionsQueryDto) {
    this.assertDateRange(query.occurredFrom, query.occurredTo, 'occurredFrom', 'occurredTo');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildFinanceTransactionsWhere(query);

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.financeTransaction.findMany({
        where,
        include: financeTransactionInclude,
        orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.financeTransaction.count({ where }),
    ]);

    return {
      items: transactions.map((transaction) => presentFinanceTransaction(transaction)),
      total,
      page,
      limit,
      pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async createFinanceTransaction(
    dto: CreateFinanceTransactionDto,
    currentUser: PresentedUser,
    auditContext: FinanceAuditContext,
  ) {
    const category = await this.getFinanceCategoryOrThrow(dto.categoryCode);
    const references = await this.resolveTransactionReferences({
      managerId: dto.managerId,
      orderId: dto.orderId,
      orderReturnId: dto.orderReturnId,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.financeTransaction.create({
        data: {
          categoryCode: category.code,
          managerId: references.managerId,
          orderId: references.orderId,
          orderReturnId: references.orderReturnId,
          amount: this.toDecimal(dto.amount),
          currencyCode: dto.currencyCode ?? DEFAULT_CURRENCY_CODE,
          reference: dto.reference?.trim() ?? null,
          description: dto.description?.trim() ?? null,
          occurredAt: dto.occurredAt ?? new Date(),
        },
        include: financeTransactionInclude,
      });

      await this.createAuditLog(tx, {
        actorId: currentUser.id,
        entityType: 'finance_transaction',
        entityId: transaction.id,
        action: 'create',
        summary: `Finance transaction ${transaction.id} was created.`,
        changes: this.toAuditJson(presentFinanceTransaction(transaction)),
        auditContext,
      });

      return transaction;
    });

    return presentFinanceTransaction(created);
  }

  async updateFinanceTransaction(
    transactionId: string,
    dto: UpdateFinanceTransactionDto,
    currentUser: PresentedUser,
    auditContext: FinanceAuditContext,
  ) {
    const existing = await this.prisma.financeTransaction.findUnique({
      where: { id: transactionId },
      include: financeTransactionInclude,
    });

    if (!existing) {
      throw new NotFoundException(`Finance transaction "${transactionId}" was not found.`);
    }

    const category = dto.categoryCode
      ? await this.getFinanceCategoryOrThrow(dto.categoryCode)
      : await this.getFinanceCategoryOrThrow(existing.categoryCode);
    const references = await this.resolveTransactionReferences({
      managerId: dto.managerId ?? existing.managerId ?? undefined,
      orderId: dto.orderId ?? existing.orderId ?? undefined,
      orderReturnId: dto.orderReturnId ?? existing.orderReturnId ?? undefined,
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.financeTransaction.update({
        where: { id: transactionId },
        data: {
          categoryCode: category.code,
          managerId: references.managerId,
          orderId: references.orderId,
          orderReturnId: references.orderReturnId,
          amount:
            dto.amount !== undefined ? this.toDecimal(dto.amount) : existing.amount,
          currencyCode: dto.currencyCode ?? existing.currencyCode,
          reference: dto.reference?.trim() ?? existing.reference,
          description: dto.description?.trim() ?? existing.description,
          occurredAt: dto.occurredAt ?? existing.occurredAt,
        },
        include: financeTransactionInclude,
      });

      await this.createAuditLog(tx, {
        actorId: currentUser.id,
        entityType: 'finance_transaction',
        entityId: transaction.id,
        action: 'update',
        summary: `Finance transaction ${transaction.id} was updated.`,
        changes: this.toAuditJson({
          before: presentFinanceTransaction(existing),
          after: presentFinanceTransaction(transaction),
        }),
        auditContext,
      });

      return transaction;
    });

    return presentFinanceTransaction(updated);
  }

  async listFinancePayouts(query: ListFinancePayoutsQueryDto) {
    this.assertDateRange(query.periodFrom, query.periodTo, 'periodFrom', 'periodTo');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildPayoutWhere({
      managerId: query.managerId,
      status: query.status,
      periodFrom: query.periodFrom,
      periodTo: query.periodTo,
    });

    const [payouts, total] = await this.prisma.$transaction([
      this.prisma.managerPayout.findMany({
        where,
        include: managerPayoutInclude,
        orderBy: [{ periodEnd: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.managerPayout.count({ where }),
    ]);

    return {
      items: payouts.map((payout) => presentManagerPayout(payout)),
      total,
      page,
      limit,
      pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async createFinancePayout(
    dto: CreateManagerPayoutDto,
    currentUser: PresentedUser,
    auditContext: FinanceAuditContext,
  ) {
    const defaultPeriodPoint = new Date();
    const periodStart = dto.periodStart ?? dto.periodEnd ?? defaultPeriodPoint;
    const periodEnd = dto.periodEnd ?? dto.periodStart ?? periodStart;

    if (periodStart > periodEnd) {
      throw new BadRequestException('periodStart cannot be later than periodEnd.');
    }

    await this.ensureManagerExists(dto.managerId);

    const existing = await this.prisma.managerPayout.findUnique({
      where: {
        managerId_periodStart_periodEnd: {
          managerId: dto.managerId,
          periodStart,
          periodEnd,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('A payout for this manager and period already exists.');
    }

    const availableToWithdraw = await this.calculateManagerAvailableToWithdraw(dto.managerId);
    const amount = this.toDecimal(dto.amount);

    if (amount.greaterThan(availableToWithdraw)) {
      throw new BadRequestException('Payout amount exceeds the manager available to withdraw.');
    }

    const payout = await this.prisma.$transaction(async (tx) => {
      const created = await tx.managerPayout.create({
        data: {
          managerId: dto.managerId,
          createdById: currentUser.id,
          amount,
          currencyCode: dto.currencyCode ?? DEFAULT_CURRENCY_CODE,
          periodStart,
          periodEnd,
          notes: dto.notes?.trim() ?? null,
          status: ManagerPayoutStatus.PAID,
          paidAt: new Date(),
        },
        include: managerPayoutInclude,
      });

      await this.createAuditLog(tx, {
        actorId: currentUser.id,
        entityType: 'manager_payout',
        entityId: created.id,
        action: 'create',
        summary: `Manager payout ${created.id} was created.`,
        changes: this.toAuditJson(presentManagerPayout(created)),
        auditContext,
      });

      return created;
    });

    return presentManagerPayout(payout);
  }

  private buildManagerCompletedOrdersWhere(
    managerId: string,
    range?: { from?: Date; to?: Date },
  ): Prisma.OrderWhereInput {
    return {
      managerId,
      orderStatusCode: COMPLETED_ORDER_STATUS_CODE,
      completedAt: {
        not: null,
        ...(range?.from ? { gte: range.from } : {}),
        ...(range?.to ? { lte: this.endOfDay(range.to) } : {}),
      },
      orderReturns: {
        none: {},
      },
    };
  }

  private buildPayoutWhere(params: {
    managerId?: string;
    status?: ManagerPayoutStatus;
    paidFrom?: Date;
    paidTo?: Date;
    periodFrom?: Date;
    periodTo?: Date;
  }): Prisma.ManagerPayoutWhereInput {
    const filters: Prisma.ManagerPayoutWhereInput[] = [];

    if (params.managerId) {
      filters.push({ managerId: params.managerId });
    }

    if (params.status) {
      filters.push({ status: params.status });
    }

    if (params.paidFrom || params.paidTo) {
      filters.push({
        paidAt: {
          ...(params.paidFrom ? { gte: params.paidFrom } : {}),
          ...(params.paidTo ? { lte: this.endOfDay(params.paidTo) } : {}),
        },
      });
    }

    if (params.periodFrom || params.periodTo) {
      const periodFilters: Prisma.ManagerPayoutWhereInput[] = [];

      if (params.periodFrom) {
        periodFilters.push({ periodEnd: { gte: params.periodFrom } });
      }

      if (params.periodTo) {
        periodFilters.push({ periodStart: { lte: this.endOfDay(params.periodTo) } });
      }

      filters.push({
        AND: periodFilters,
      });
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private buildSummaryTransactionWhere(from?: Date, to?: Date): Prisma.FinanceTransactionWhereInput {
    if (!from && !to) {
      return {};
    }

    return {
      occurredAt: {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: this.endOfDay(to) } : {}),
      },
    };
  }

  private buildSummaryPaidPayoutWhere(from?: Date, to?: Date): Prisma.ManagerPayoutWhereInput {
    return {
      status: ManagerPayoutStatus.PAID,
      ...(from || to
        ? {
            paidAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: this.endOfDay(to) } : {}),
            },
          }
        : {}),
    };
  }

  private buildFinanceTransactionsWhere(
    query: ListFinanceTransactionsQueryDto,
  ): Prisma.FinanceTransactionWhereInput {
    const filters: Prisma.FinanceTransactionWhereInput[] = [];

    if (query.categoryCode) {
      filters.push({ categoryCode: query.categoryCode });
    }

    if (query.direction) {
      filters.push({
        category: {
          is: {
            direction: query.direction,
          },
        },
      });
    }

    if (query.managerId) {
      filters.push({ managerId: query.managerId });
    }

    if (query.occurredFrom || query.occurredTo) {
      filters.push({
        occurredAt: {
          ...(query.occurredFrom ? { gte: query.occurredFrom } : {}),
          ...(query.occurredTo ? { lte: this.endOfDay(query.occurredTo) } : {}),
        },
      });
    }

    const search = query.search?.trim();

    if (search) {
      filters.push({
        OR: [
          { reference: { contains: search } },
          { description: { contains: search } },
          {
            manager: {
              is: {
                OR: [
                  { firstName: { contains: search } },
                  { lastName: { contains: search } },
                  { email: { contains: search } },
                  { phone: { contains: search } },
                ],
              },
            },
          },
          {
            order: {
              is: {
                OR: [
                  { orderNumber: { contains: search } },
                  { customerName: { contains: search } },
                ],
              },
            },
          },
          {
            orderReturn: {
              is: {
                returnNumber: { contains: search },
              },
            },
          },
        ],
      });
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private async resolveTransactionReferences(params: {
    managerId?: string;
    orderId?: string;
    orderReturnId?: string;
  }) {
    let managerId = params.managerId ?? null;
    let orderId = params.orderId ?? null;
    let orderReturnId = params.orderReturnId ?? null;

    const order = orderId
      ? await this.prisma.order.findUnique({
          where: { id: orderId },
          select: { id: true, managerId: true },
        })
      : null;

    if (orderId && !order) {
      throw new BadRequestException(`Order "${orderId}" was not found.`);
    }

    const orderReturn = orderReturnId
      ? await this.prisma.orderReturn.findUnique({
          where: { id: orderReturnId },
          select: { id: true, orderId: true, order: { select: { managerId: true } } },
        })
      : null;

    if (orderReturnId && !orderReturn) {
      throw new BadRequestException(`Return "${orderReturnId}" was not found.`);
    }

    if (order && !managerId) {
      managerId = order.managerId;
    }

    if (orderReturn && !orderId) {
      orderId = orderReturn.orderId;
    }

    if (orderReturn && !managerId) {
      managerId = orderReturn.order.managerId;
    }

    if (order && orderReturn && order.id !== orderReturn.orderId) {
      throw new BadRequestException('orderId and orderReturnId must reference the same order.');
    }

    if (managerId) {
      await this.ensureManagerExists(managerId);
    }

    if (order && managerId && order.managerId !== managerId) {
      throw new BadRequestException('managerId must match the linked order manager.');
    }

    if (orderReturn && managerId && orderReturn.order.managerId !== managerId) {
      throw new BadRequestException('managerId must match the linked return manager.');
    }

    return {
      managerId,
      orderId,
      orderReturnId,
    };
  }

  private async getFinanceCategoryOrThrow(code: string) {
    const category = await this.prisma.financeCategory.findUnique({
      where: { code },
      select: { code: true, direction: true },
    });

    if (!category) {
      throw new BadRequestException(`Finance category "${code}" was not found.`);
    }

    return category;
  }

  private async ensureManagerExists(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { id: true, roleCode: true },
    });

    if (!manager || manager.roleCode !== AppRole.MANAGER) {
      throw new BadRequestException(`Manager "${managerId}" was not found.`);
    }
  }

  private async calculateManagerAvailableToWithdraw(managerId: string) {
    const completedOrders = await this.prisma.order.findMany({
      where: this.buildManagerCompletedOrdersWhere(managerId),
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        currencyCode: true,
        saleAmount: true,
        purchaseAmount: true,
        completedAt: true,
        createdAt: true,
      },
    });

    const totals = this.buildManagerEarningsTotals(completedOrders);
    const paidPayouts = await this.sumPayoutsByStatuses(managerId, [ManagerPayoutStatus.PAID]);
    const available = totals.totalEarnings.sub(paidPayouts);

    return available.greaterThanOrEqualTo(ZERO_DECIMAL) ? available : ZERO_DECIMAL;
  }

  private buildManagerEarningsTotals(orders: ManagerCompletedOrderRecord[]) {
    let totalMargin = ZERO_DECIMAL;
    let totalEarnings = ZERO_DECIMAL;

    for (const order of orders) {
      const margin = this.calculateOrderMargin(order);
      const earning = this.calculateManagerEarning(margin);
      totalMargin = totalMargin.add(margin);
      totalEarnings = totalEarnings.add(earning);
    }

    return { totalMargin, totalEarnings };
  }

  private presentManagerEarning(order: ManagerCompletedOrderRecord) {
    const margin = this.calculateOrderMargin(order);
    const managerEarnings = this.calculateManagerEarning(margin);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      currencyCode: order.currencyCode,
      saleAmount: order.saleAmount,
      purchaseAmount: order.purchaseAmount,
      margin,
      managerEarnings,
      completedAt: order.completedAt,
      createdAt: order.createdAt,
    };
  }

  private buildManagerEarningsChart(orders: ManagerCompletedOrderRecord[]) {
    const buckets = new Map<
      string,
      { period: string; margin: number; earnings: number; ordersCount: number }
    >();

    for (const order of orders) {
      const date = order.completedAt ?? order.createdAt;
      const period = this.toMonthKey(date);
      const margin = this.calculateOrderMargin(order);
      const earnings = this.calculateManagerEarning(margin);

      if (!buckets.has(period)) {
        buckets.set(period, { period, margin: 0, earnings: 0, ordersCount: 0 });
      }

      const bucket = buckets.get(period)!;
      bucket.margin += Number(margin);
      bucket.earnings += Number(earnings);
      bucket.ordersCount += 1;
    }

    return Array.from(buckets.values());
  }

  private calculateOrderMargin(order: {
    saleAmount: Prisma.Decimal;
    purchaseAmount: Prisma.Decimal;
  }) {
    return new Decimal(order.saleAmount).sub(order.purchaseAmount);
  }

  private calculateManagerEarning(margin: Prisma.Decimal) {
    return new Decimal(margin).mul(MANAGER_EARNING_RATE);
  }

  private async sumPayoutsByStatuses(managerId: string, statuses: ManagerPayoutStatus[]) {
    const aggregate = await this.prisma.managerPayout.aggregate({
      where: {
        managerId,
        status: { in: statuses },
      },
      _sum: {
        amount: true,
      },
    });

    return aggregate._sum.amount ?? ZERO_DECIMAL;
  }

  private async createAuditLog(
    prisma: PrismaExecutor,
    params: {
      actorId: string;
      entityType: string;
      entityId: string;
      action: string;
      summary: string;
      changes: Prisma.InputJsonValue;
      auditContext: FinanceAuditContext;
    },
  ) {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        summary: params.summary,
        changes: params.changes,
        ipAddress: params.auditContext.ipAddress,
        userAgent: params.auditContext.userAgent,
      },
    });
  }

  private assertDateRange(from: Date | undefined, to: Date | undefined, fromLabel: string, toLabel: string) {
    if (from && to && from > to) {
      throw new BadRequestException(`${fromLabel} cannot be later than ${toLabel}.`);
    }
  }

  private endOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private toMonthKey(date: Date) {
    return date.toISOString().slice(0, 7);
  }

  private toDecimal(value: number | string | Prisma.Decimal) {
    return new Decimal(value);
  }

  private toAuditJson(value: unknown) {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }
}
