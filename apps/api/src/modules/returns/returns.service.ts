import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from '../roles/role-code.enum';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { MoveOrderToReturnDto } from './dto/move-order-to-return.dto';
import { ListReturnsQueryDto } from './dto/list-returns-query.dto';
import { UpdateOrderReturnDto } from './dto/update-order-return.dto';
import { UpdateOrderReturnStatusDto } from './dto/update-order-return-status.dto';
import {
  getAllowedNextReturnStatuses,
  hasConfiguredReturnStatusWorkflow,
  isResolvedReturnStatus,
} from './return-status-workflow';
import {
  orderReturnDetailsInclude,
  orderReturnListInclude,
  presentOrderReturnDetail,
  presentOrderReturnListItem,
} from './presenters/order-return.presenter';
import type { ReturnAuditContext } from './returns.types';

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

const RETURN_MOVE_BLOCKED_ORDER_STATUSES = new Set(['cancelled', 'problematic']);

type ReturnMoveOrderRecord = Prisma.OrderGetPayload<{
  select: {
    id: true;
    orderNumber: true;
    managerId: true;
    orderStatusCode: true;
    customerName: true;
    totalAmount: true;
    currencyCode: true;
    isProblematic: true;
    _count: {
      select: {
        orderReturns: true;
      };
    };
  };
}>;

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async listReturns(query: ListReturnsQueryDto, currentUser: PresentedUser) {
    if (query.requestedFrom && query.requestedTo && query.requestedFrom > query.requestedTo) {
      throw new BadRequestException('requestedFrom cannot be later than requestedTo.');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildReturnListWhere(query, currentUser);

    const [orderReturns, total] = await this.prisma.$transaction([
      this.prisma.orderReturn.findMany({
        where,
        include: orderReturnListInclude,
        orderBy: [{ requestedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.orderReturn.count({ where }),
    ]);

    return {
      items: orderReturns.map((orderReturn) => presentOrderReturnListItem(orderReturn)),
      total,
      page,
      limit,
      pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async getReturnById(returnId: string, currentUser: PresentedUser) {
    const orderReturn = await this.findAccessibleReturnOrThrow(returnId, currentUser);
    return presentOrderReturnDetail(orderReturn);
  }

  async updateReturn(
    returnId: string,
    dto: UpdateOrderReturnDto,
    currentUser: PresentedUser,
    auditContext: ReturnAuditContext,
  ) {
    const existingOrderReturn = await this.findAccessibleReturnOrThrow(returnId, currentUser);
    const nextAmount =
      dto.amount !== undefined ? this.toDecimal(dto.amount) : existingOrderReturn.amount;

    this.assertReturnAmountWithinOrder(nextAmount, existingOrderReturn.order.totalAmount);

    const updatedOrderReturn = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orderReturn.update({
        where: { id: returnId },
        data: {
          reason: dto.reason?.trim() ?? existingOrderReturn.reason,
          notes: dto.notes?.trim() ?? existingOrderReturn.notes,
          amount: nextAmount,
        },
        include: orderReturnDetailsInclude,
      });

      await this.createOrderReturnAuditLog(tx, {
        actorId: currentUser.id,
        entityId: updated.id,
        action: 'update',
        summary: `Return ${updated.returnNumber} was updated.`,
        changes: {
          before: this.buildOrderReturnAuditSnapshot(existingOrderReturn),
          after: this.buildOrderReturnAuditSnapshot(updated),
        },
        metadata: {
          returnNumber: updated.returnNumber,
          orderId: updated.orderId,
          orderNumber: updated.order.orderNumber,
        },
        auditContext,
      });

      return updated;
    });

    return presentOrderReturnDetail(updatedOrderReturn);
  }

  async updateReturnStatus(
    returnId: string,
    dto: UpdateOrderReturnStatusDto,
    currentUser: PresentedUser,
    auditContext: ReturnAuditContext,
  ) {
    const existingOrderReturn = await this.findAccessibleReturnOrThrow(returnId, currentUser);
    const status = await this.getReturnStatusOrThrow(this.prisma, dto.returnStatusCode);

    this.assertAllowedReturnStatusTransition(existingOrderReturn.returnStatusCode, status.code);

    const updatedOrderReturn = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.orderReturn.update({
        where: { id: returnId },
        data: {
          returnStatusCode: status.code,
          notes: dto.notes?.trim() ?? existingOrderReturn.notes,
          processedById: currentUser.id,
          resolvedAt: isResolvedReturnStatus(status.code)
            ? existingOrderReturn.resolvedAt ?? new Date()
            : existingOrderReturn.resolvedAt,
        },
        include: orderReturnDetailsInclude,
      });

      await this.createOrderReturnAuditLog(tx, {
        actorId: currentUser.id,
        entityId: updated.id,
        action: 'status_change',
        summary: `Return ${updated.returnNumber} status changed from ${existingOrderReturn.returnStatusCode} to ${updated.returnStatusCode}.`,
        changes: {
          before: {
            returnStatusCode: existingOrderReturn.returnStatusCode,
            notes: existingOrderReturn.notes,
            processedById: existingOrderReturn.processedById,
            resolvedAt: existingOrderReturn.resolvedAt,
          },
          after: {
            returnStatusCode: updated.returnStatusCode,
            notes: updated.notes,
            processedById: updated.processedById,
            resolvedAt: updated.resolvedAt,
          },
        },
        metadata: {
          returnNumber: updated.returnNumber,
          orderId: updated.orderId,
          orderNumber: updated.order.orderNumber,
        },
        auditContext,
      });

      return updated;
    });

    return presentOrderReturnDetail(updatedOrderReturn);
  }

  async moveOrderToReturn(
    orderId: string,
    dto: MoveOrderToReturnDto,
    currentUser: PresentedUser,
    auditContext: ReturnAuditContext,
  ) {
    const order = await this.findAccessibleOrderForReturnMoveOrThrow(orderId, currentUser);
    this.assertAllowedOrderMoveToReturn(order);

    await this.ensureReturnStatusExists('requested');

    const amount = this.toDecimal(dto.amount ?? order.totalAmount);
    this.assertReturnAmountWithinOrder(amount, order.totalAmount);

    const createdOrderReturn = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          isProblematic: true,
        },
      });

      const created = await tx.orderReturn.create({
        data: {
          returnNumber: this.generateReturnNumber(),
          orderId: order.id,
          returnStatusCode: 'requested',
          reason: dto.reason?.trim() ?? null,
          notes: dto.notes?.trim() ?? null,
          amount,
          requestedAt: new Date(),
        },
        include: orderReturnDetailsInclude,
      });

      await Promise.all([
        this.createOrderAuditLog(tx, {
          actorId: currentUser.id,
          entityId: order.id,
          action: 'move_to_return',
          summary: `Order ${order.orderNumber} was moved to returns workflow.`,
          changes: {
            before: {
              orderStatusCode: order.orderStatusCode,
              isProblematic: order.isProblematic,
              orderReturnsCount: order._count.orderReturns,
            },
            after: {
              orderStatusCode: order.orderStatusCode,
              isProblematic: true,
              orderReturnsCount: order._count.orderReturns + 1,
              orderReturnId: created.id,
              orderReturnNumber: created.returnNumber,
            },
          },
          metadata: {
            orderNumber: order.orderNumber,
            orderReturnId: created.id,
            orderReturnNumber: created.returnNumber,
          },
          auditContext,
        }),
        this.createOrderReturnAuditLog(tx, {
          actorId: currentUser.id,
          entityId: created.id,
          action: 'create',
          summary: `Return ${created.returnNumber} was created from order ${order.orderNumber}.`,
          changes: {
            orderId: created.orderId,
            orderNumber: order.orderNumber,
            returnStatusCode: created.returnStatusCode,
            amount: created.amount,
            reason: created.reason,
            notes: created.notes,
          },
          metadata: {
            orderNumber: order.orderNumber,
            returnNumber: created.returnNumber,
          },
          auditContext,
        }),
      ]);

      return created;
    });

    return presentOrderReturnDetail(createdOrderReturn);
  }

  private buildReturnListWhere(query: ListReturnsQueryDto, currentUser: PresentedUser) {
    const filters: Prisma.OrderReturnWhereInput[] = [];

    if (currentUser.roleCode === AppRole.MANAGER) {
      filters.push({
        order: {
          is: {
            managerId: currentUser.id,
          },
        },
      });
    } else if (query.managerId) {
      filters.push({
        order: {
          is: {
            managerId: query.managerId,
          },
        },
      });
    }

    if (query.returnStatusCode) {
      filters.push({ returnStatusCode: query.returnStatusCode });
    }

    if (query.orderId) {
      filters.push({ orderId: query.orderId });
    }

    if (query.requestedFrom || query.requestedTo) {
      filters.push({
        requestedAt: {
          ...(query.requestedFrom ? { gte: query.requestedFrom } : {}),
          ...(query.requestedTo ? { lte: this.endOfDay(query.requestedTo) } : {}),
        },
      });
    }

    const search = query.search?.trim();

    if (search) {
      filters.push({
        OR: [
          { returnNumber: { contains: search } },
          { reason: { contains: search } },
          {
            order: {
              is: {
                OR: [
                  { orderNumber: { contains: search } },
                  { customerName: { contains: search } },
                  { customerPhone: { contains: search } },
                  { customerPhoneExtra: { contains: search } },
                  {
                    shipments: {
                      some: {
                        OR: [
                          { trackingNumber: { contains: search } },
                          { externalRef: { contains: search } },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      });
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private async findAccessibleReturnOrThrow(returnId: string, currentUser: PresentedUser) {
    const orderReturn = await this.prisma.orderReturn.findFirst({
      where: {
        id: returnId,
        ...(currentUser.roleCode === AppRole.ADMIN
          ? {}
          : {
              order: {
                is: {
                  managerId: currentUser.id,
                },
              },
            }),
      },
      include: orderReturnDetailsInclude,
    });

    if (!orderReturn) {
      throw new NotFoundException(`Return "${returnId}" was not found.`);
    }

    return orderReturn;
  }

  private async findAccessibleOrderForReturnMoveOrThrow(
    orderId: string,
    currentUser: PresentedUser,
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(currentUser.roleCode === AppRole.ADMIN ? {} : { managerId: currentUser.id }),
      },
      select: {
        id: true,
        orderNumber: true,
        managerId: true,
        orderStatusCode: true,
        customerName: true,
        totalAmount: true,
        currencyCode: true,
        isProblematic: true,
        _count: {
          select: {
            orderReturns: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" was not found.`);
    }

    return order;
  }

  private assertAllowedOrderMoveToReturn(order: ReturnMoveOrderRecord) {
    if (order._count.orderReturns > 0) {
      throw new BadRequestException(
        `Order "${order.orderNumber}" is already linked to a return workflow.`,
      );
    }

    if (RETURN_MOVE_BLOCKED_ORDER_STATUSES.has(order.orderStatusCode)) {
      throw new BadRequestException(
        `Order "${order.orderNumber}" cannot be moved to returns from "${order.orderStatusCode}" status.`,
      );
    }
  }

  private async ensureReturnStatusExists(code: string) {
    await this.getReturnStatusOrThrow(this.prisma, code);
  }

  private async getReturnStatusOrThrow(prisma: PrismaExecutor, code: string) {
    const status = await prisma.returnStatus.findUnique({
      where: { code },
      select: {
        code: true,
        isTerminal: true,
      },
    });

    if (!status) {
      throw new BadRequestException(`Return status "${code}" was not found.`);
    }

    return status;
  }

  private assertAllowedReturnStatusTransition(currentStatusCode: string, nextStatusCode: string) {
    if (!hasConfiguredReturnStatusWorkflow(currentStatusCode)) {
      throw new BadRequestException(
        `Return status "${currentStatusCode}" is not configured in the CRM workflow.`,
      );
    }

    const allowedTransitions = getAllowedNextReturnStatuses(currentStatusCode);

    if (allowedTransitions.includes(nextStatusCode)) {
      return;
    }

    if (currentStatusCode === nextStatusCode) {
      throw new BadRequestException(`Return is already in "${currentStatusCode}" status.`);
    }

    throw new BadRequestException(
      allowedTransitions.length > 0
        ? `Invalid return status transition from "${currentStatusCode}" to "${nextStatusCode}". Allowed transitions: ${allowedTransitions.join(', ')}.`
        : `Invalid return status transition from "${currentStatusCode}" to "${nextStatusCode}". No further transitions are allowed from "${currentStatusCode}".`,
    );
  }

  private assertReturnAmountWithinOrder(
    amount: Prisma.Decimal,
    orderTotalAmount: Prisma.Decimal,
  ) {
    if (amount.greaterThan(orderTotalAmount)) {
      throw new BadRequestException('Return amount cannot exceed the linked order total.');
    }
  }

  private buildOrderReturnAuditSnapshot(orderReturn: {
    id: string;
    orderId: string;
    returnNumber: string;
    returnStatusCode: string;
    processedById: string | null;
    reason: string | null;
    notes: string | null;
    amount: Prisma.Decimal;
    requestedAt: Date;
    resolvedAt: Date | null;
  }) {
    return {
      id: orderReturn.id,
      orderId: orderReturn.orderId,
      returnNumber: orderReturn.returnNumber,
      returnStatusCode: orderReturn.returnStatusCode,
      processedById: orderReturn.processedById,
      reason: orderReturn.reason,
      notes: orderReturn.notes,
      amount: orderReturn.amount,
      requestedAt: orderReturn.requestedAt,
      resolvedAt: orderReturn.resolvedAt,
    };
  }

  private async createOrderAuditLog(
    prisma: PrismaExecutor,
    params: {
      actorId: string;
      entityId: string;
      action: string;
      summary: string;
      changes: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
      auditContext: ReturnAuditContext;
    },
  ) {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        entityType: 'order',
        entityId: params.entityId,
        action: params.action,
        summary: params.summary,
        changes: params.changes,
        metadata: params.metadata,
        ipAddress: params.auditContext.ipAddress,
        userAgent: params.auditContext.userAgent,
      },
    });
  }

  private async createOrderReturnAuditLog(
    prisma: PrismaExecutor,
    params: {
      actorId: string;
      entityId: string;
      action: string;
      summary: string;
      changes: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
      auditContext: ReturnAuditContext;
    },
  ) {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        entityType: 'order_return',
        entityId: params.entityId,
        action: params.action,
        summary: params.summary,
        changes: params.changes,
        metadata: params.metadata,
        ipAddress: params.auditContext.ipAddress,
        userAgent: params.auditContext.userAgent,
      },
    });
  }

  private generateReturnNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `RET-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private endOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private toDecimal(value: number | string | Prisma.Decimal) {
    return new Decimal(value);
  }
}
