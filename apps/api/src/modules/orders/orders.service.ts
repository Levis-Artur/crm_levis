import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { randomUUID } from 'node:crypto';
import { AppRole } from '../roles/role-code.enum';
import { PrismaService } from '../prisma/prisma.service';
import type { PresentedUser } from '../users/presenters/user.presenter';
import {
  getAllowedNextOrderStatuses,
  hasConfiguredOrderStatusWorkflow,
  isCompletedOrderStatus,
} from './order-status-workflow';
import type { CreateOrderItemDto } from './dto/create-order-item.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import type { UpdateOrderDto } from './dto/update-order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  orderDetailsInclude,
  orderListInclude,
  presentOrderDetail,
  presentOrderListItem,
} from './presenters/order.presenter';
import type { OrderAuditContext } from './orders.types';

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

type NormalizedOrderItem = {
  sku: string | null;
  purchaseLink: string | null;
  productName: string;
  quantity: number;
  purchasePrice: Prisma.Decimal;
  salePrice: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
};

type ExistingOrderItem = {
  sku: string | null;
  purchaseLink: string | null;
  productName: string;
  quantity: number;
  purchasePrice: Prisma.Decimal;
  salePrice: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(query: ListOrdersQueryDto, currentUser: PresentedUser) {
    if (query.placedFrom && query.placedTo && query.placedFrom > query.placedTo) {
      throw new BadRequestException('placedFrom cannot be later than placedTo.');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = this.buildOrderListWhere(query, currentUser);

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderListInclude,
        orderBy: [{ placedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items: orders.map((order) => presentOrderListItem(order)),
      total,
      page,
      limit,
      pageCount: total > 0 ? Math.ceil(total / limit) : 0,
    };
  }

  async createOrder(
    dto: CreateOrderDto,
    currentUser: PresentedUser,
    auditContext: OrderAuditContext,
  ) {
    const managerId = await this.resolveManagerIdForWrite(currentUser, dto.managerId);
    const normalizedItems = this.normalizeItems(dto.items);
    const totals = this.computeTotals(normalizedItems, dto.shippingCost);

    await Promise.all([
      this.ensureOrderStatusExists(dto.orderStatusCode ?? 'new'),
      this.ensurePaymentStatusExists(dto.paymentStatusCode ?? 'unpaid'),
      this.ensureDeliveryStatusExists(dto.deliveryStatusCode ?? 'pending'),
    ]);

    const order = await this.prisma.$transaction(async (tx) => {
      const status = await this.getOrderStatusOrThrow(tx, dto.orderStatusCode ?? 'new');

      const created = await tx.order.create({
        data: {
          orderNumber: this.generateOrderNumber(),
          managerId,
          orderStatusCode: status.code,
          paymentStatusCode: dto.paymentStatusCode ?? 'unpaid',
          deliveryStatusCode: dto.deliveryStatusCode ?? 'pending',
          customerName: dto.customerName.trim(),
          customerPhone: dto.customerPhone?.trim() ?? null,
          customerPhoneExtra: dto.customerPhoneExtra?.trim() ?? null,
          customerEmail: dto.customerEmail?.trim() ?? null,
          city: dto.city?.trim() ?? null,
          deliveryPoint: dto.deliveryPoint?.trim() ?? null,
          deliveryMethod: dto.deliveryMethod?.trim() ?? null,
          paymentMethod: dto.paymentMethod?.trim() ?? null,
          currencyCode: dto.currencyCode ?? 'UAH',
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          totalAmount: totals.totalAmount,
          purchaseAmount: totals.purchaseAmount,
          saleAmount: totals.saleAmount,
          marginAmount: totals.marginAmount,
          prepaymentAmount: this.toDecimal(dto.prepaymentAmount ?? 0),
          shippingCost: totals.shippingCost,
          notes: dto.comment?.trim() ?? null,
          internalNote: dto.internalNote?.trim() ?? null,
          isProblematic: dto.isProblematic ?? false,
          placedAt: dto.placedAt ?? new Date(),
          completedAt: isCompletedOrderStatus(status.code) ? dto.placedAt ?? new Date() : null,
          items: {
            create: this.buildOrderItemsCreate(normalizedItems),
          },
        },
        include: orderDetailsInclude,
      });

      await this.createAuditLog(tx, {
        actorId: currentUser.id,
        entityId: created.id,
        action: 'create',
        summary: `Order ${created.orderNumber} was created.`,
        changes: {
          managerId: created.managerId,
          orderStatusCode: created.orderStatusCode,
          paymentStatusCode: created.paymentStatusCode,
          deliveryStatusCode: created.deliveryStatusCode,
          totals,
        },
        metadata: {
          orderNumber: created.orderNumber,
        },
        auditContext,
      });

      return created;
    });

    return presentOrderDetail(order);
  }

  async getOrderById(orderId: string, currentUser: PresentedUser) {
    const order = await this.findAccessibleOrderOrThrow(orderId, currentUser);
    return presentOrderDetail(order);
  }

  async updateOrder(
    orderId: string,
    dto: UpdateOrderDto,
    currentUser: PresentedUser,
    auditContext: OrderAuditContext,
  ) {
    const existingOrder = await this.findAccessibleOrderOrThrow(orderId, currentUser);
    const managerId = await this.resolveManagerIdForUpdate(
      currentUser,
      existingOrder.managerId,
      dto.managerId,
    );
    const nextItems = dto.items
      ? this.normalizeItems(dto.items)
      : this.mapExistingItems(existingOrder.items);

    await Promise.all([
      dto.paymentStatusCode
        ? this.ensurePaymentStatusExists(dto.paymentStatusCode)
        : Promise.resolve(),
      dto.deliveryStatusCode
        ? this.ensureDeliveryStatusExists(dto.deliveryStatusCode)
        : Promise.resolve(),
    ]);

    const totals = this.computeTotals(nextItems, dto.shippingCost ?? existingOrder.shippingCost);
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          managerId,
          paymentStatusCode: dto.paymentStatusCode ?? existingOrder.paymentStatusCode,
          deliveryStatusCode: dto.deliveryStatusCode ?? existingOrder.deliveryStatusCode,
          customerName: dto.customerName?.trim() ?? existingOrder.customerName,
          customerPhone: dto.customerPhone?.trim() ?? existingOrder.customerPhone,
          customerPhoneExtra: dto.customerPhoneExtra?.trim() ?? existingOrder.customerPhoneExtra,
          customerEmail: dto.customerEmail?.trim() ?? existingOrder.customerEmail,
          city: dto.city?.trim() ?? existingOrder.city,
          deliveryPoint: dto.deliveryPoint?.trim() ?? existingOrder.deliveryPoint,
          deliveryMethod: dto.deliveryMethod?.trim() ?? existingOrder.deliveryMethod,
          paymentMethod: dto.paymentMethod?.trim() ?? existingOrder.paymentMethod,
          currencyCode: dto.currencyCode ?? existingOrder.currencyCode,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          totalAmount: totals.totalAmount,
          purchaseAmount: totals.purchaseAmount,
          saleAmount: totals.saleAmount,
          marginAmount: totals.marginAmount,
          prepaymentAmount:
            dto.prepaymentAmount !== undefined
              ? this.toDecimal(dto.prepaymentAmount)
              : existingOrder.prepaymentAmount,
          shippingCost: totals.shippingCost,
          notes: dto.comment?.trim() ?? existingOrder.notes,
          internalNote: dto.internalNote?.trim() ?? existingOrder.internalNote,
          cancelReason: dto.cancelReason?.trim() ?? existingOrder.cancelReason,
          isProblematic: dto.isProblematic ?? existingOrder.isProblematic,
          placedAt: dto.placedAt ?? existingOrder.placedAt,
          ...(dto.items
            ? {
                items: {
                  deleteMany: {},
                  create: this.buildOrderItemsCreate(nextItems),
                },
              }
            : {}),
        },
        include: orderDetailsInclude,
      });

      await this.createAuditLog(tx, {
        actorId: currentUser.id,
        entityId: updated.id,
        action: 'update',
        summary: `Order ${updated.orderNumber} was updated.`,
        changes: {
          before: this.buildAuditSnapshot(existingOrder),
          after: this.buildAuditSnapshot(updated),
        },
        metadata: {
          orderNumber: updated.orderNumber,
        },
        auditContext,
      });

      return updated;
    });

    return presentOrderDetail(updatedOrder);
  }

  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    currentUser: PresentedUser,
    auditContext: OrderAuditContext,
  ) {
    const existingOrder = await this.findAccessibleOrderOrThrow(orderId, currentUser);
    const status = await this.getOrderStatusOrThrow(this.prisma, dto.orderStatusCode);
    this.assertAllowedStatusTransition(existingOrder.orderStatusCode, status.code);

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatusCode: status.code,
          cancelReason: dto.cancelReason?.trim() ?? existingOrder.cancelReason,
          completedAt: isCompletedOrderStatus(status.code)
            ? existingOrder.completedAt ?? new Date()
            : existingOrder.completedAt,
        },
        include: orderDetailsInclude,
      });

      await this.createAuditLog(tx, {
        actorId: currentUser.id,
        entityId: updated.id,
        action: 'status_change',
        summary: `Order ${updated.orderNumber} status changed from ${existingOrder.orderStatusCode} to ${status.code}.`,
        changes: {
          before: {
            orderStatusCode: existingOrder.orderStatusCode,
            cancelReason: existingOrder.cancelReason,
            completedAt: existingOrder.completedAt,
          },
          after: {
            orderStatusCode: updated.orderStatusCode,
            cancelReason: updated.cancelReason,
            completedAt: updated.completedAt,
          },
        },
        metadata: {
          orderNumber: updated.orderNumber,
        },
        auditContext,
      });

      return updated;
    });

    return presentOrderDetail(updatedOrder);
  }

  private buildOrderListWhere(query: ListOrdersQueryDto, currentUser: PresentedUser) {
    const filters: Prisma.OrderWhereInput[] = [];

    filters.push({
      orderReturns: {
        none: {},
      },
    });

    if (currentUser.roleCode === AppRole.MANAGER) {
      filters.push({ managerId: currentUser.id });
    } else if (query.managerId) {
      filters.push({ managerId: query.managerId });
    }

    if (query.orderStatusCode) {
      filters.push({ orderStatusCode: query.orderStatusCode });
    }

    if (query.placedFrom || query.placedTo) {
      filters.push({
        placedAt: {
          ...(query.placedFrom ? { gte: query.placedFrom } : {}),
          ...(query.placedTo ? { lte: this.endOfDay(query.placedTo) } : {}),
        },
      });
    }

    const search = query.search?.trim();

    if (search) {
      filters.push({
        OR: [
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
      });
    }

    return filters.length > 0 ? { AND: filters } : {};
  }

  private async findAccessibleOrderOrThrow(orderId: string, currentUser: PresentedUser) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        ...(currentUser.roleCode === AppRole.ADMIN ? {} : { managerId: currentUser.id }),
      },
      include: orderDetailsInclude,
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" was not found.`);
    }

    return order;
  }

  private async resolveManagerIdForWrite(currentUser: PresentedUser, requestedManagerId?: string) {
    if (currentUser.roleCode === AppRole.MANAGER) {
      if (requestedManagerId && requestedManagerId !== currentUser.id) {
        throw new ForbiddenException('Managers can only create orders for themselves.');
      }

      return currentUser.id;
    }

    if (!requestedManagerId) {
      throw new BadRequestException('managerId is required when an administrator creates an order.');
    }

    await this.ensureManagerExists(requestedManagerId);
    return requestedManagerId;
  }

  private async resolveManagerIdForUpdate(
    currentUser: PresentedUser,
    currentManagerId: string,
    requestedManagerId?: string,
  ) {
    if (currentUser.roleCode === AppRole.MANAGER) {
      if (requestedManagerId && requestedManagerId !== currentUser.id) {
        throw new ForbiddenException('Managers cannot reassign orders to another manager.');
      }

      return currentUser.id;
    }

    if (!requestedManagerId) {
      return currentManagerId;
    }

    await this.ensureManagerExists(requestedManagerId);
    return requestedManagerId;
  }

  private async ensureManagerExists(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        roleCode: true,
        isActive: true,
      },
    });

    if (!manager || manager.roleCode !== AppRole.MANAGER) {
      throw new BadRequestException(`Manager "${managerId}" was not found.`);
    }

    if (!manager.isActive) {
      throw new BadRequestException(`Manager "${managerId}" is inactive.`);
    }
  }

  private async ensureOrderStatusExists(code: string) {
    await this.getOrderStatusOrThrow(this.prisma, code);
  }

  private async ensurePaymentStatusExists(code: string) {
    const paymentStatus = await this.prisma.paymentStatus.findUnique({
      where: { code },
      select: { code: true },
    });

    if (!paymentStatus) {
      throw new BadRequestException(`Payment status "${code}" was not found.`);
    }
  }

  private async ensureDeliveryStatusExists(code: string) {
    const deliveryStatus = await this.prisma.deliveryStatus.findUnique({
      where: { code },
      select: { code: true },
    });

    if (!deliveryStatus) {
      throw new BadRequestException(`Delivery status "${code}" was not found.`);
    }
  }

  private async getOrderStatusOrThrow(prisma: PrismaExecutor, code: string) {
    const status = await prisma.orderStatus.findUnique({
      where: { code },
      select: {
        code: true,
        isTerminal: true,
      },
    });

    if (!status) {
      throw new BadRequestException(`Order status "${code}" was not found.`);
    }

    return status;
  }

  private assertAllowedStatusTransition(currentStatusCode: string, nextStatusCode: string) {
    if (!hasConfiguredOrderStatusWorkflow(currentStatusCode)) {
      throw new BadRequestException(
        `Order status "${currentStatusCode}" is not configured in the CRM workflow.`,
      );
    }

    const allowedTransitions = getAllowedNextOrderStatuses(currentStatusCode);

    if (allowedTransitions.includes(nextStatusCode)) {
      return;
    }

    if (currentStatusCode === nextStatusCode) {
      throw new BadRequestException(
        `Order is already in "${currentStatusCode}" status.`,
      );
    }

    throw new BadRequestException(
      allowedTransitions.length > 0
        ? `Invalid order status transition from "${currentStatusCode}" to "${nextStatusCode}". Allowed transitions: ${allowedTransitions.join(', ')}.`
        : `Invalid order status transition from "${currentStatusCode}" to "${nextStatusCode}". No further transitions are allowed from "${currentStatusCode}".`,
    );
  }

  private normalizeItems(items: CreateOrderItemDto[]): NormalizedOrderItem[] {
    return items.map((item) => {
      const quantity = item.quantity;
      const purchasePrice = this.toDecimal(item.purchasePrice);
      const salePrice = this.toDecimal(item.salePrice);
      const discountAmount = this.toDecimal(item.discountAmount ?? 0);
      const lineGross = salePrice.mul(quantity);

      if (discountAmount.greaterThan(lineGross)) {
        throw new BadRequestException(
          `Discount for item "${item.productName}" cannot exceed its gross sale amount.`,
        );
      }

      return {
        sku: item.sku?.trim() ?? null,
        purchaseLink: item.purchaseLink?.trim() ?? null,
        productName: item.productName.trim(),
        quantity,
        purchasePrice,
        salePrice,
        discountAmount,
      };
    });
  }

  private mapExistingItems(items: ExistingOrderItem[]): NormalizedOrderItem[] {
    return items.map((item) => ({
      sku: item.sku,
      purchaseLink: item.purchaseLink,
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: new Decimal(item.purchasePrice),
      salePrice: new Decimal(item.salePrice),
      discountAmount: new Decimal(item.discountAmount),
    }));
  }

  private computeTotals(
    items: NormalizedOrderItem[],
    shippingCostInput?: number | Prisma.Decimal | null,
  ) {
    const shippingCost = this.toDecimal(shippingCostInput ?? 0);
    let subtotal = new Decimal(0);
    let purchaseAmount = new Decimal(0);
    let discountTotal = new Decimal(0);

    for (const item of items) {
      subtotal = subtotal.add(item.salePrice.mul(item.quantity));
      purchaseAmount = purchaseAmount.add(item.purchasePrice.mul(item.quantity));
      discountTotal = discountTotal.add(item.discountAmount);
    }

    const saleAmount = subtotal.sub(discountTotal);
    const totalAmount = saleAmount.add(shippingCost);
    const marginAmount = saleAmount.sub(purchaseAmount).sub(shippingCost);

    return {
      subtotal,
      purchaseAmount,
      discountTotal,
      saleAmount,
      totalAmount,
      marginAmount,
      shippingCost,
    };
  }

  private buildOrderItemsCreate(items: NormalizedOrderItem[]) {
    return items.map((item, index) => ({
      lineNumber: index + 1,
      sku: item.sku,
      purchaseLink: item.purchaseLink,
      productName: item.productName,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      unitPrice: item.salePrice,
      discountAmount: item.discountAmount,
      lineTotal: item.salePrice.mul(item.quantity).sub(item.discountAmount),
    }));
  }

  private buildAuditSnapshot(order: {
    id: string;
    orderNumber: string;
    managerId: string;
    orderStatusCode: string;
    paymentStatusCode: string;
    deliveryStatusCode: string;
    customerName: string;
    customerPhone: string | null;
    city: string | null;
    deliveryMethod: string | null;
    paymentMethod: string | null;
    subtotal: Prisma.Decimal;
    discountTotal: Prisma.Decimal;
    totalAmount: Prisma.Decimal;
    purchaseAmount: Prisma.Decimal;
    saleAmount: Prisma.Decimal;
    marginAmount: Prisma.Decimal;
    shippingCost: Prisma.Decimal;
    prepaymentAmount: Prisma.Decimal;
    isProblematic: boolean;
    cancelReason: string | null;
    notes: string | null;
    internalNote: string | null;
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      managerId: order.managerId,
      orderStatusCode: order.orderStatusCode,
      paymentStatusCode: order.paymentStatusCode,
      deliveryStatusCode: order.deliveryStatusCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      city: order.city,
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      totalAmount: order.totalAmount,
      purchaseAmount: order.purchaseAmount,
      saleAmount: order.saleAmount,
      marginAmount: order.marginAmount,
      shippingCost: order.shippingCost,
      prepaymentAmount: order.prepaymentAmount,
      isProblematic: order.isProblematic,
      cancelReason: order.cancelReason,
      notes: order.notes,
      internalNote: order.internalNote,
    };
  }

  private async createAuditLog(
    prisma: PrismaExecutor,
    params: {
      actorId: string;
      entityId: string;
      action: string;
      summary: string;
      changes: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
      auditContext: OrderAuditContext;
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

  private generateOrderNumber() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
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
