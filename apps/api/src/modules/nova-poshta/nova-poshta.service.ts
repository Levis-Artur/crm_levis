import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ShipmentProvider } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from '../roles/role-code.enum';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { CreateOrderShipmentDto } from './dto/create-order-shipment.dto';
import { NovaPoshtaApiService } from './nova-poshta-api.service';
import { mapNovaPoshtaStatus } from './nova-poshta-status.mapper';
import { presentShipmentDetail, shipmentDetailsInclude } from './presenters/shipment.presenter';
import type {
  NovaPoshtaTrackingStatusRecord,
  ShipmentAuditContext,
} from './nova-poshta.types';

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

type ShipmentCreateOrderRecord = Prisma.OrderGetPayload<{
  select: {
    id: true;
    orderNumber: true;
    managerId: true;
    customerName: true;
    customerPhone: true;
    city: true;
    deliveryPoint: true;
    currencyCode: true;
    saleAmount: true;
    totalAmount: true;
    prepaymentAmount: true;
    shippingCost: true;
    deliveryStatusCode: true;
  };
}>;

@Injectable()
export class NovaPoshtaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly novaPoshtaApiService: NovaPoshtaApiService,
  ) {}

  async createShipmentFromOrder(
    orderId: string,
    dto: CreateOrderShipmentDto,
    currentUser: PresentedUser,
    auditContext: ShipmentAuditContext,
  ) {
    const order = await this.findAccessibleOrderForShipmentOrThrow(orderId, currentUser);
    const existingActiveShipment = await this.findActiveNovaPoshtaShipment(order.id);

    if (existingActiveShipment) {
      throw new BadRequestException(
        `Order "${order.orderNumber}" already has an active Nova Poshta shipment${existingActiveShipment.trackingNumber ? ` (${existingActiveShipment.trackingNumber})` : ''}.`,
      );
    }

    const recipientName = dto.recipientName?.trim() ?? order.customerName.trim();
    const recipientPhone = dto.recipientPhone?.trim() ?? order.customerPhone?.trim() ?? null;
    const destinationCity = dto.destinationCity?.trim() ?? order.city?.trim() ?? null;
    const destinationBranch =
      dto.destinationBranch?.trim() ?? order.deliveryPoint?.trim() ?? null;

    const resolvedShipmentData = this.assertOrderShipmentData(order.orderNumber, {
      recipientName,
      recipientPhone,
      destinationCity,
      destinationBranch,
    });

    const declaredValue = this.resolveDeclaredValue(order, dto.declaredValue);
    const cashOnDeliveryAmount = this.resolveCashOnDeliveryAmount(
      order,
      dto.cashOnDeliveryAmount,
    );
    const providerResponse = await this.novaPoshtaApiService.createExpressWaybill({
      recipientRef: dto.recipientRef,
      recipientContactRef: dto.recipientContactRef,
      recipientCityRef: dto.recipientCityRef,
      recipientWarehouseRef: dto.recipientWarehouseRef,
      recipientPhone: resolvedShipmentData.recipientPhone,
      declaredValue: this.formatDecimal(declaredValue),
      cashOnDeliveryAmount: this.formatDecimal(cashOnDeliveryAmount),
      weight: this.formatDecimal(
        this.toDecimal(dto.weight ?? this.novaPoshtaApiService.getDefaultWeight()),
        3,
      ),
      seatsAmount: String(
        dto.seatsAmount ?? this.novaPoshtaApiService.getDefaultSeatsAmount(),
      ),
      cargoDescription: dto.cargoDescription?.trim() || `Order ${order.orderNumber}`,
      serviceType: this.novaPoshtaApiService.getDefaultServiceType(),
      payerType: this.novaPoshtaApiService.getDefaultPayerType(),
      paymentMethod: this.novaPoshtaApiService.getDefaultPaymentMethod(),
      cargoType: this.novaPoshtaApiService.getDefaultCargoType(),
    });

    const now = new Date();
    const deliveryStatusCode = 'ready_to_ship';
    const shippingCost = this.resolveShippingCost(
      order,
      dto.shippingCost,
      providerResponse.record.CostOnSite,
    );

    const shipment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          orderId: order.id,
          provider: ShipmentProvider.NOVA_POSHTA,
          deliveryStatusCode,
          externalRef: providerResponse.record.Ref ?? null,
          trackingNumber: providerResponse.record.IntDocNumber ?? null,
          recipientName: resolvedShipmentData.recipientName,
          recipientPhone: resolvedShipmentData.recipientPhone,
          destinationCity: resolvedShipmentData.destinationCity,
          destinationBranch: resolvedShipmentData.destinationBranch,
          declaredValue,
          cashOnDeliveryAmount,
          shippingCost,
          metadata: {
            provider: 'nova_poshta',
            senderName: this.novaPoshtaApiService.getSenderName(),
            recipientRef: dto.recipientRef,
            recipientContactRef: dto.recipientContactRef,
            recipientCityRef: dto.recipientCityRef,
            recipientWarehouseRef: dto.recipientWarehouseRef,
            estimatedDeliveryDate: providerResponse.record.EstimatedDeliveryDate ?? null,
          },
          rawPayloadJson: providerResponse.raw,
          lastSyncedAt: now,
        },
        include: shipmentDetailsInclude,
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryStatusCode,
        },
      });

      await this.createShipmentAuditLog(tx, {
        actorId: currentUser.id,
        entityId: created.id,
        action: 'create',
        summary: `Nova Poshta shipment was created for order ${order.orderNumber}.`,
        changes: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          trackingNumber: created.trackingNumber,
          externalRef: created.externalRef,
          deliveryStatusCode: created.deliveryStatusCode,
        },
        metadata: {
          provider: created.provider,
        },
        auditContext,
      });

      return created;
    });

    return presentShipmentDetail(shipment);
  }

  async getOrderShipment(orderId: string, currentUser: PresentedUser) {
    await this.findAccessibleOrderForShipmentOrThrow(orderId, currentUser);

    const shipment = await this.prisma.shipment.findFirst({
      where: {
        orderId,
        provider: ShipmentProvider.NOVA_POSHTA,
      },
      include: shipmentDetailsInclude,
      orderBy: [{ createdAt: 'desc' }],
    });

    return {
      shipment: shipment ? presentShipmentDetail(shipment) : null,
    };
  }

  async syncShipment(
    shipmentId: string,
    currentUser: PresentedUser,
    auditContext: ShipmentAuditContext,
  ) {
    const shipment = await this.findAccessibleShipmentOrThrow(shipmentId, currentUser);

    if (shipment.provider !== ShipmentProvider.NOVA_POSHTA) {
      throw new BadRequestException(
        `Shipment "${shipmentId}" is not a Nova Poshta shipment.`,
      );
    }

    if (!shipment.trackingNumber) {
      throw new BadRequestException(
        `Shipment "${shipmentId}" does not have a tracking number.`,
      );
    }

    const providerResponse = await this.novaPoshtaApiService.fetchShipmentStatus(
      shipment.trackingNumber,
      shipment.recipientPhone,
    );

    const mappedStatus = mapNovaPoshtaStatus(
      providerResponse.record.StatusCode,
      providerResponse.record.Status,
    );
    const nextDeliveryStatusCode =
      mappedStatus.deliveryStatusCode === 'pending'
        ? shipment.deliveryStatusCode
        : mappedStatus.deliveryStatusCode;
    const nextDispatchedAt =
      shipment.dispatchedAt ??
      (mappedStatus.shouldSetDispatchedAt
        ? this.resolveProviderDate(providerResponse.record) ?? new Date()
        : null);
    const nextDeliveredAt =
      shipment.deliveredAt ??
      (mappedStatus.shouldSetDeliveredAt
        ? this.resolveDeliveredDate(providerResponse.record) ?? new Date()
        : null);

    const updatedShipment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          deliveryStatusCode: nextDeliveryStatusCode,
          externalRef: providerResponse.record.RefEW ?? shipment.externalRef,
          rawPayloadJson: providerResponse.raw,
          metadata: this.mergeMetadata(shipment.metadata, {
            provider: 'nova_poshta',
            externalStatusCode: mappedStatus.externalStatusCode,
            externalStatusText: mappedStatus.externalStatusText,
          }),
          lastSyncedAt: new Date(),
          dispatchedAt: nextDispatchedAt,
          deliveredAt: nextDeliveredAt,
          destinationBranch:
            providerResponse.record.WarehouseRecipientNumber ??
            shipment.destinationBranch,
        },
        include: shipmentDetailsInclude,
      });

      await tx.order.update({
        where: { id: shipment.orderId },
        data: {
          deliveryStatusCode: nextDeliveryStatusCode,
        },
      });

      await this.createShipmentAuditLog(tx, {
        actorId: currentUser.id,
        entityId: updated.id,
        action: 'sync',
        summary: `Nova Poshta shipment ${updated.trackingNumber ?? updated.id} was synced.`,
        changes: {
          before: {
            deliveryStatusCode: shipment.deliveryStatusCode,
            lastSyncedAt: shipment.lastSyncedAt,
          },
          after: {
            deliveryStatusCode: updated.deliveryStatusCode,
            lastSyncedAt: updated.lastSyncedAt,
          },
        },
        metadata: {
          externalStatusCode: mappedStatus.externalStatusCode,
          externalStatusText: mappedStatus.externalStatusText,
        },
        auditContext,
      });

      if (shipment.deliveryStatusCode !== updated.deliveryStatusCode) {
        await this.createShipmentAuditLog(tx, {
          actorId: currentUser.id,
          entityId: updated.id,
          action: 'status_change',
          summary: `Shipment status changed from ${shipment.deliveryStatusCode} to ${updated.deliveryStatusCode}.`,
          changes: {
            before: {
              deliveryStatusCode: shipment.deliveryStatusCode,
            },
            after: {
              deliveryStatusCode: updated.deliveryStatusCode,
            },
          },
          metadata: {
            externalStatusCode: mappedStatus.externalStatusCode,
            externalStatusText: mappedStatus.externalStatusText,
          },
          auditContext,
        });
      }

      return updated;
    });

    return presentShipmentDetail(updatedShipment);
  }

  private async findAccessibleOrderForShipmentOrThrow(
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
        customerName: true,
        customerPhone: true,
        city: true,
        deliveryPoint: true,
        currencyCode: true,
        saleAmount: true,
        totalAmount: true,
        prepaymentAmount: true,
        shippingCost: true,
        deliveryStatusCode: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order "${orderId}" was not found.`);
    }

    return order;
  }

  private async findActiveNovaPoshtaShipment(orderId: string) {
    return this.prisma.shipment.findFirst({
      where: {
        orderId,
        provider: ShipmentProvider.NOVA_POSHTA,
        deliveryStatus: {
          is: {
            isTerminal: false,
          },
        },
      },
      select: {
        id: true,
        trackingNumber: true,
        deliveryStatusCode: true,
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  private async findAccessibleShipmentOrThrow(
    shipmentId: string,
    currentUser: PresentedUser,
  ) {
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        id: shipmentId,
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
      include: shipmentDetailsInclude,
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment "${shipmentId}" was not found.`);
    }

    return shipment;
  }

  private resolveDeclaredValue(order: ShipmentCreateOrderRecord, declaredValue?: number) {
    return declaredValue !== undefined
      ? this.toDecimal(declaredValue)
      : this.toDecimal(order.saleAmount);
  }

  private resolveCashOnDeliveryAmount(
    order: ShipmentCreateOrderRecord,
    cashOnDeliveryAmount?: number,
  ) {
    if (cashOnDeliveryAmount !== undefined) {
      return this.toDecimal(cashOnDeliveryAmount);
    }

    const remaining = this.toDecimal(order.totalAmount).sub(order.prepaymentAmount);
    return remaining.greaterThan(0) ? remaining : new Decimal(0);
  }

  private resolveShippingCost(
    order: ShipmentCreateOrderRecord,
    shippingCost: number | undefined,
    providerShippingCost?: string | null,
  ) {
    if (shippingCost !== undefined) {
      return this.toDecimal(shippingCost);
    }

    if (providerShippingCost && providerShippingCost.trim().length > 0) {
      return this.toDecimal(providerShippingCost);
    }

    return this.toDecimal(order.shippingCost);
  }

  private assertOrderShipmentData(
    orderNumber: string,
    resolved: {
      recipientName: string | null;
      recipientPhone: string | null;
      destinationCity: string | null;
      destinationBranch: string | null;
    },
  ): {
    recipientName: string;
    recipientPhone: string;
    destinationCity: string;
    destinationBranch: string;
  } {
    const missingFields = [
      !resolved.recipientName ? 'recipientName' : null,
      !resolved.recipientPhone ? 'recipientPhone' : null,
      !resolved.destinationCity ? 'destinationCity' : null,
      !resolved.destinationBranch ? 'destinationBranch' : null,
    ].filter((value): value is string => value !== null);

    if (missingFields.length === 0) {
      return {
        recipientName: resolved.recipientName!,
        recipientPhone: resolved.recipientPhone!,
        destinationCity: resolved.destinationCity!,
        destinationBranch: resolved.destinationBranch!,
      };
    }

    throw new BadRequestException(
      `Order "${orderNumber}" does not have enough data for Nova Poshta shipment creation. Missing: ${missingFields.join(', ')}.`,
    );
  }

  private resolveProviderDate(providerRecord: NovaPoshtaTrackingStatusRecord) {
    return (
      this.parseProviderDate(providerRecord.DateCreated) ??
      this.parseProviderDate(providerRecord.ScheduledDeliveryDate)
    );
  }

  private resolveDeliveredDate(providerRecord: NovaPoshtaTrackingStatusRecord) {
    return (
      this.parseProviderDate(providerRecord.ActualDeliveryDate) ??
      this.parseProviderDate(providerRecord.ScheduledDeliveryDate) ??
      this.parseProviderDate(providerRecord.DateCreated)
    );
  }

  private parseProviderDate(value?: string | null) {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      return null;
    }

    const parsed = new Date(trimmed);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const match = trimmed.match(
      /^(\d{2})\.(\d{2})\.(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
    );

    if (!match) {
      return null;
    }

    const [, day, month, year, hours = '00', minutes = '00', seconds = '00'] = match;
    const rebuilt = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      Number(seconds),
    );

    return Number.isNaN(rebuilt.getTime()) ? null : rebuilt;
  }

  private mergeMetadata(
    current: Prisma.JsonValue | null,
    patch: Record<string, string | null>,
  ): Prisma.InputJsonValue {
    const existing =
      current && typeof current === 'object' && !Array.isArray(current)
        ? (current as Record<string, unknown>)
        : {};

    return {
      ...existing,
      ...patch,
    } as Prisma.InputJsonValue;
  }

  private async createShipmentAuditLog(
    prisma: PrismaExecutor,
    params: {
      actorId: string;
      entityId: string;
      action: string;
      summary: string;
      changes: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
      auditContext: ShipmentAuditContext;
    },
  ) {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        entityType: 'shipment',
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

  private formatDecimal(value: Decimal, scale = 2) {
    return value.toFixed(scale);
  }

  private toDecimal(value: number | string | Prisma.Decimal) {
    return new Decimal(value);
  }
}
