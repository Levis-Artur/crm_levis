import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { FinanceSummaryQueryDto } from '../finance/dto/finance-summary-query.dto';
import { FinanceService } from '../finance/finance.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppRole } from '../roles/role-code.enum';
import { presentUser } from '../users/presenters/user.presenter';
import type { PresentedUser } from '../users/presenters/user.presenter';
import type { AiCapability } from './ai.types';

type AiToolDefinition = {
  type: 'function';
  name: string;
  description: string;
  strict: true;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

type SearchOrdersArgs = {
  search?: string | null;
  orderStatusCode?: string | null;
  managerId?: string | null;
  managerQuery?: string | null;
  problematicOnly?: boolean | null;
  placedFrom?: string | null;
  placedTo?: string | null;
  limit?: number | null;
};

type GetOrderDetailsArgs = {
  orderId: string;
};

type GetReturnsSummaryArgs = {
  managerId?: string | null;
  managerQuery?: string | null;
  returnStatusCode?: string | null;
  requestedFrom?: string | null;
  requestedTo?: string | null;
  limit?: number | null;
};

type GetManagerFinanceSummaryArgs = {
  managerId?: string | null;
  managerQuery?: string | null;
};

type GetAdminFinanceSummaryArgs = {
  from?: string | null;
  to?: string | null;
};

type GetShipmentStatusArgs = {
  orderId?: string | null;
  orderNumber?: string | null;
  trackingNumber?: string | null;
};

type DraftClientMessageArgs = {
  clientName?: string | null;
  topic: string;
  facts: string[];
  tone?: 'friendly' | 'neutral' | 'formal' | null;
  length?: 'short' | 'medium' | null;
};

type ToolExecutor<TArgs> = (args: TArgs, currentUser: PresentedUser) => Promise<unknown>;

const SEARCH_ORDER_LIMIT_DEFAULT = 10;
const SEARCH_ORDER_LIMIT_MAX = 20;
const RETURN_SUMMARY_LIMIT_DEFAULT = 8;
const RETURN_SUMMARY_LIMIT_MAX = 15;

export const AI_TOOL_DEFINITIONS: AiToolDefinition[] = [
  {
    type: 'function',
    name: 'searchOrders',
    description:
      'Знаходить активні замовлення CRM за фільтрами, пошуком, менеджером або ознакою проблемності.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        search: { type: ['string', 'null'] },
        orderStatusCode: { type: ['string', 'null'] },
        managerId: { type: ['string', 'null'] },
        managerQuery: { type: ['string', 'null'] },
        problematicOnly: { type: ['boolean', 'null'] },
        placedFrom: { type: ['string', 'null'] },
        placedTo: { type: ['string', 'null'] },
        limit: { type: ['number', 'null'] },
      },
      required: [
        'search',
        'orderStatusCode',
        'managerId',
        'managerQuery',
        'problematicOnly',
        'placedFrom',
        'placedTo',
        'limit',
      ],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getOrderDetails',
    description:
      'Повертає детальну інформацію по одному замовленню CRM, включно з товарами, статусами та відправленнями.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
      },
      required: ['orderId'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getReturnsSummary',
    description:
      'Повертає коротке зведення по поверненнях: кількість, суми, статуси та останні записи.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        managerId: { type: ['string', 'null'] },
        managerQuery: { type: ['string', 'null'] },
        returnStatusCode: { type: ['string', 'null'] },
        requestedFrom: { type: ['string', 'null'] },
        requestedTo: { type: ['string', 'null'] },
        limit: { type: ['number', 'null'] },
      },
      required: [
        'managerId',
        'managerQuery',
        'returnStatusCode',
        'requestedFrom',
        'requestedTo',
        'limit',
      ],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getManagerFinanceSummary',
    description:
      'Повертає зведення по фінансах менеджера: заробіток, маржа, виплати та доступно до виведення.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        managerId: { type: ['string', 'null'] },
        managerQuery: { type: ['string', 'null'] },
      },
      required: ['managerId', 'managerQuery'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getAdminFinanceSummary',
    description:
      'Повертає загальне зведення фінансів компанії для адміністратора за вибраний період.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        from: { type: ['string', 'null'] },
        to: { type: ['string', 'null'] },
      },
      required: ['from', 'to'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getShipmentStatus',
    description:
      'Повертає стан відправлення за замовленням, номером замовлення або ТТН разом із поясненням статусу доставки.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: ['string', 'null'] },
        orderNumber: { type: ['string', 'null'] },
        trackingNumber: { type: ['string', 'null'] },
      },
      required: ['orderId', 'orderNumber', 'trackingNumber'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'draftClientMessage',
    description:
      'Готує короткий клієнтський текст українською мовою на основі заданих фактів без змін у CRM.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        clientName: { type: ['string', 'null'] },
        topic: { type: 'string' },
        facts: {
          type: 'array',
          items: { type: 'string' },
        },
        tone: {
          type: ['string', 'null'],
          enum: ['friendly', 'neutral', 'formal', null],
        },
        length: {
          type: ['string', 'null'],
          enum: ['short', 'medium', null],
        },
      },
      required: ['clientName', 'topic', 'facts', 'tone', 'length'],
      additionalProperties: false,
    },
  },
];

export const AI_CAPABILITIES: AiCapability[] = AI_TOOL_DEFINITIONS.map((tool) => ({
  name: tool.name,
  description: tool.description,
}));

@Injectable()
export class AiToolsService {
  private readonly executors: Record<string, ToolExecutor<any>>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly financeService: FinanceService,
  ) {
    this.executors = {
      searchOrders: (args, currentUser) => this.searchOrders(args, currentUser),
      getOrderDetails: (args, currentUser) => this.getOrderDetails(args, currentUser),
      getReturnsSummary: (args, currentUser) => this.getReturnsSummary(args, currentUser),
      getManagerFinanceSummary: (args, currentUser) =>
        this.getManagerFinanceSummary(args, currentUser),
      getAdminFinanceSummary: (args, currentUser) =>
        this.getAdminFinanceSummary(args, currentUser),
      getShipmentStatus: (args, currentUser) => this.getShipmentStatus(args, currentUser),
      draftClientMessage: (args, currentUser) => this.draftClientMessage(args, currentUser),
    };
  }

  getToolDefinitions() {
    return AI_TOOL_DEFINITIONS;
  }

  getCapabilities() {
    return AI_CAPABILITIES;
  }

  async executeTool(name: string, rawArgs: Record<string, unknown>, currentUser: PresentedUser) {
    const executor = this.executors[name];

    if (!executor) {
      throw new BadRequestException(`AI tool "${name}" is not supported.`);
    }

    return executor(rawArgs, currentUser);
  }

  private async searchOrders(args: SearchOrdersArgs, currentUser: PresentedUser) {
    const placedFrom = this.parseOptionalDate(args.placedFrom, 'placedFrom');
    const placedTo = this.parseOptionalDate(args.placedTo, 'placedTo');

    if (placedFrom && placedTo && placedFrom > placedTo) {
      throw new BadRequestException('placedFrom cannot be later than placedTo.');
    }

    const managerId = await this.resolveManagerScope({
      currentUser,
      requestedManagerId: args.managerId ?? undefined,
      requestedManagerQuery: args.managerQuery ?? undefined,
      allowOmittedForAdmin: true,
    });
    const limit = this.normalizeLimit(args.limit, SEARCH_ORDER_LIMIT_DEFAULT, SEARCH_ORDER_LIMIT_MAX);

    const filters: Prisma.OrderWhereInput[] = [
      {
        orderReturns: {
          none: {},
        },
      },
    ];

    if (currentUser.roleCode === AppRole.MANAGER) {
      filters.push({ managerId: currentUser.id });
    } else if (managerId) {
      filters.push({ managerId });
    }

    if (args.orderStatusCode?.trim()) {
      filters.push({ orderStatusCode: args.orderStatusCode.trim() });
    }

    if (args.problematicOnly) {
      filters.push({ isProblematic: true });
    }

    if (placedFrom || placedTo) {
      filters.push({
        placedAt: {
          ...(placedFrom ? { gte: placedFrom } : {}),
          ...(placedTo ? { lte: this.endOfDay(placedTo) } : {}),
        },
      });
    }

    const search = args.search?.trim();

    if (search) {
      filters.push({
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
      });
    }

    const where = filters.length > 0 ? { AND: filters } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: [{ placedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          managerId: true,
          manager: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          orderStatusCode: true,
          deliveryStatusCode: true,
          totalAmount: true,
          marginAmount: true,
          isProblematic: true,
          placedAt: true,
          shipments: {
            select: {
              trackingNumber: true,
              deliveryStatusCode: true,
            },
            orderBy: [{ createdAt: 'desc' }],
            take: 1,
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      total,
      limit,
      filters: {
        search: search ?? null,
        orderStatusCode: args.orderStatusCode?.trim() ?? null,
        problematicOnly: Boolean(args.problematicOnly),
        managerId:
          currentUser.roleCode === AppRole.MANAGER ? currentUser.id : managerId ?? null,
        placedFrom: placedFrom?.toISOString() ?? null,
        placedTo: placedTo?.toISOString() ?? null,
      },
      items: items.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        managerId: order.managerId,
        managerName: `${order.manager.firstName} ${order.manager.lastName}`.trim(),
        orderStatusCode: order.orderStatusCode,
        deliveryStatusCode: order.deliveryStatusCode,
        totalAmount: order.totalAmount,
        marginAmount: order.marginAmount,
        isProblematic: order.isProblematic,
        placedAt: order.placedAt,
        latestTrackingNumber: order.shipments[0]?.trackingNumber ?? null,
        latestShipmentDeliveryStatusCode: order.shipments[0]?.deliveryStatusCode ?? null,
      })),
    };
  }

  private async getOrderDetails(args: GetOrderDetailsArgs, currentUser: PresentedUser) {
    if (!args.orderId?.trim()) {
      throw new BadRequestException('orderId is required.');
    }

    return this.ordersService.getOrderById(args.orderId.trim(), currentUser);
  }

  private async getReturnsSummary(args: GetReturnsSummaryArgs, currentUser: PresentedUser) {
    const requestedFrom = this.parseOptionalDate(args.requestedFrom, 'requestedFrom');
    const requestedTo = this.parseOptionalDate(args.requestedTo, 'requestedTo');

    if (requestedFrom && requestedTo && requestedFrom > requestedTo) {
      throw new BadRequestException('requestedFrom cannot be later than requestedTo.');
    }

    const managerId = await this.resolveManagerScope({
      currentUser,
      requestedManagerId: args.managerId ?? undefined,
      requestedManagerQuery: args.managerQuery ?? undefined,
      allowOmittedForAdmin: true,
    });
    const limit = this.normalizeLimit(args.limit, RETURN_SUMMARY_LIMIT_DEFAULT, RETURN_SUMMARY_LIMIT_MAX);
    const filters: Prisma.OrderReturnWhereInput[] = [];

    if (currentUser.roleCode === AppRole.MANAGER) {
      filters.push({
        order: {
          is: {
            managerId: currentUser.id,
          },
        },
      });
    } else if (managerId) {
      filters.push({
        order: {
          is: {
            managerId,
          },
        },
      });
    }

    if (args.returnStatusCode?.trim()) {
      filters.push({ returnStatusCode: args.returnStatusCode.trim() });
    }

    if (requestedFrom || requestedTo) {
      filters.push({
        requestedAt: {
          ...(requestedFrom ? { gte: requestedFrom } : {}),
          ...(requestedTo ? { lte: this.endOfDay(requestedTo) } : {}),
        },
      });
    }

    const where = filters.length > 0 ? { AND: filters } : {};
    const [returns, groupedByStatus, aggregate] = await this.prisma.$transaction([
      this.prisma.orderReturn.findMany({
        where,
        orderBy: [{ requestedAt: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          returnNumber: true,
          returnStatusCode: true,
          reason: true,
          amount: true,
          requestedAt: true,
          resolvedAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              customerName: true,
              managerId: true,
              manager: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.orderReturn.groupBy({
        by: ['returnStatusCode'],
        where,
        orderBy: {
          returnStatusCode: 'asc',
        },
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.orderReturn.aggregate({
        where,
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      total: aggregate._count.id,
      totalAmount: aggregate._sum.amount ?? new Decimal(0),
      filters: {
        managerId:
          currentUser.roleCode === AppRole.MANAGER ? currentUser.id : managerId ?? null,
        returnStatusCode: args.returnStatusCode?.trim() ?? null,
        requestedFrom: requestedFrom?.toISOString() ?? null,
        requestedTo: requestedTo?.toISOString() ?? null,
      },
      statusBreakdown: groupedByStatus.map((item) => ({
        returnStatusCode: item.returnStatusCode,
        count:
          typeof item._count === 'object' && item._count
            ? item._count._all ?? 0
            : 0,
        totalAmount: item._sum?.amount ?? new Decimal(0),
      })),
      items: returns.map((orderReturn) => ({
        id: orderReturn.id,
        returnNumber: orderReturn.returnNumber,
        returnStatusCode: orderReturn.returnStatusCode,
        reason: orderReturn.reason,
        amount: orderReturn.amount,
        requestedAt: orderReturn.requestedAt,
        resolvedAt: orderReturn.resolvedAt,
        orderId: orderReturn.order.id,
        orderNumber: orderReturn.order.orderNumber,
        customerName: orderReturn.order.customerName,
        managerId: orderReturn.order.managerId,
        managerName: `${orderReturn.order.manager.firstName} ${orderReturn.order.manager.lastName}`.trim(),
      })),
    };
  }

  private async getManagerFinanceSummary(
    args: GetManagerFinanceSummaryArgs,
    currentUser: PresentedUser,
  ) {
    const managerUser = await this.resolveManagerUser({
      currentUser,
      requestedManagerId: args.managerId ?? undefined,
      requestedManagerQuery: args.managerQuery ?? undefined,
    });

    return this.financeService.getManagerFinanceSummary(managerUser);
  }

  private async getAdminFinanceSummary(args: GetAdminFinanceSummaryArgs, currentUser: PresentedUser) {
    if (currentUser.roleCode !== AppRole.ADMIN) {
      throw new ForbiddenException('Only administrators can access global finance summary.');
    }

    const from = this.parseOptionalDate(args.from, 'from');
    const to = this.parseOptionalDate(args.to, 'to');

    if (from && to && from > to) {
      throw new BadRequestException('from cannot be later than to.');
    }

    const query = new FinanceSummaryQueryDto();
    query.from = from;
    query.to = to;

    return this.financeService.getAdminFinanceSummary(query);
  }

  private async getShipmentStatus(args: GetShipmentStatusArgs, currentUser: PresentedUser) {
    const orderId = args.orderId?.trim();
    const orderNumber = args.orderNumber?.trim();
    const trackingNumber = args.trackingNumber?.trim();

    if (!orderId && !orderNumber && !trackingNumber) {
      throw new BadRequestException(
        'One of orderId, orderNumber or trackingNumber is required.',
      );
    }

    const shipment = await this.prisma.shipment.findFirst({
      where: {
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(orderId || orderNumber
          ? {
              order: {
                is: {
                  ...(orderId ? { id: orderId } : {}),
                  ...(orderNumber ? { orderNumber } : {}),
                  ...(currentUser.roleCode === AppRole.ADMIN ? {} : { managerId: currentUser.id }),
                },
              },
            }
          : currentUser.roleCode === AppRole.ADMIN
            ? {}
            : {
                order: {
                  is: {
                    managerId: currentUser.id,
                  },
                },
              }),
      },
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        provider: true,
        externalRef: true,
        trackingNumber: true,
        deliveryStatusCode: true,
        recipientName: true,
        recipientPhone: true,
        destinationCity: true,
        destinationBranch: true,
        declaredValue: true,
        cashOnDeliveryAmount: true,
        shippingCost: true,
        lastSyncedAt: true,
        dispatchedAt: true,
        deliveredAt: true,
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            managerId: true,
            deliveryStatusCode: true,
            manager: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment was not found for the provided identifier.');
    }

    return {
      shipmentId: shipment.id,
      provider: shipment.provider,
      trackingNumber: shipment.trackingNumber,
      deliveryStatusCode: shipment.deliveryStatusCode,
      explanation: this.explainShipmentStatus(shipment.deliveryStatusCode),
      recipientName: shipment.recipientName,
      recipientPhone: shipment.recipientPhone,
      destinationCity: shipment.destinationCity,
      destinationBranch: shipment.destinationBranch,
      declaredValue: shipment.declaredValue,
      cashOnDeliveryAmount: shipment.cashOnDeliveryAmount,
      shippingCost: shipment.shippingCost,
      lastSyncedAt: shipment.lastSyncedAt,
      dispatchedAt: shipment.dispatchedAt,
      deliveredAt: shipment.deliveredAt,
      order: {
        id: shipment.order.id,
        orderNumber: shipment.order.orderNumber,
        customerName: shipment.order.customerName,
        managerId: shipment.order.managerId,
        managerName: `${shipment.order.manager.firstName} ${shipment.order.manager.lastName}`.trim(),
        deliveryStatusCode: shipment.order.deliveryStatusCode,
      },
    };
  }

  private async draftClientMessage(args: DraftClientMessageArgs, _currentUser: PresentedUser) {
    const facts = Array.isArray(args.facts)
      ? args.facts
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : [];

    if (!args.topic?.trim()) {
      throw new BadRequestException('topic is required.');
    }

    if (facts.length === 0) {
      throw new BadRequestException('facts must include at least one item.');
    }

    const tone = args.tone ?? 'neutral';
    const greetingName = args.clientName?.trim();
    const opening =
      tone === 'formal'
        ? `Доброго дня${greetingName ? `, ${greetingName}` : ''}.`
        : tone === 'friendly'
          ? `Вітаю${greetingName ? `, ${greetingName}` : ''}!`
          : `Добрий день${greetingName ? `, ${greetingName}` : ''}.`;
    const bodyIntro =
      tone === 'formal'
        ? `Пишемо щодо питання "${args.topic.trim()}".`
        : `Пишемо щодо "${args.topic.trim()}".`;
    const factLines = facts
      .slice(0, args.length === 'medium' ? 4 : 2)
      .map((fact) => `• ${fact}`)
      .join('\n');
    const closing =
      tone === 'formal'
        ? 'Якщо будуть додаткові питання, будь ласка, напишіть нам у відповідь.'
        : 'Якщо потрібні деталі, напишіть нам у відповідь.';

    return {
      topic: args.topic.trim(),
      tone,
      draft: `${opening}\n\n${bodyIntro}\n${factLines}\n\n${closing}`,
    };
  }

  private async resolveManagerScope(params: {
    currentUser: PresentedUser;
    requestedManagerId?: string;
    requestedManagerQuery?: string;
    allowOmittedForAdmin: boolean;
  }) {
    if (params.currentUser.roleCode === AppRole.MANAGER) {
      if (
        params.requestedManagerId &&
        params.requestedManagerId.trim() &&
        params.requestedManagerId.trim() !== params.currentUser.id
      ) {
        throw new ForbiddenException('Managers can access only their own data.');
      }

      if (params.requestedManagerQuery?.trim()) {
        const ownQuery = `${params.currentUser.firstName} ${params.currentUser.lastName}`.trim().toLowerCase();
        const requested = params.requestedManagerQuery.trim().toLowerCase();

        if (!ownQuery.includes(requested) && !(params.currentUser.phone ?? '').includes(requested)) {
          throw new ForbiddenException('Managers can access only their own data.');
        }
      }

      return params.currentUser.id;
    }

    if (params.requestedManagerId?.trim()) {
      const manager = await this.getManagerById(params.requestedManagerId.trim());
      return manager.id;
    }

    if (params.requestedManagerQuery?.trim()) {
      const manager = await this.findManagerByQuery(params.requestedManagerQuery.trim());
      return manager.id;
    }

    return params.allowOmittedForAdmin ? null : this.raiseMissingManagerSelector();
  }

  private async resolveManagerUser(params: {
    currentUser: PresentedUser;
    requestedManagerId?: string;
    requestedManagerQuery?: string;
  }) {
    if (params.currentUser.roleCode === AppRole.MANAGER) {
      return params.currentUser;
    }

    const managerId = await this.resolveManagerScope({
      currentUser: params.currentUser,
      requestedManagerId: params.requestedManagerId,
      requestedManagerQuery: params.requestedManagerQuery,
      allowOmittedForAdmin: false,
    });

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId! },
      include: {
        role: true,
      },
    });

    if (!manager || manager.roleCode !== AppRole.MANAGER || !manager.isActive) {
      throw new BadRequestException(`Manager "${managerId}" was not found.`);
    }

    return presentUser(manager);
  }

  private async getManagerById(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        roleCode: true,
        isActive: true,
      },
    });

    if (!manager || manager.roleCode !== AppRole.MANAGER || !manager.isActive) {
      throw new BadRequestException(`Manager "${managerId}" was not found.`);
    }

    return manager;
  }

  private async findManagerByQuery(query: string) {
    const normalized = query.trim();
    const matches = await this.prisma.user.findMany({
      where: {
        roleCode: AppRole.MANAGER,
        isActive: true,
        OR: [
          { firstName: { contains: normalized } },
          { lastName: { contains: normalized } },
          { email: { contains: normalized } },
          { phone: { contains: normalized } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      take: 3,
      orderBy: [{ createdAt: 'asc' }],
    });

    if (matches.length === 0) {
      throw new NotFoundException(`Manager "${normalized}" was not found.`);
    }

    if (matches.length > 1) {
      throw new BadRequestException(
        `Manager query "${normalized}" is ambiguous. Matches: ${matches
          .map((manager) => `${manager.firstName} ${manager.lastName}`.trim())
          .join(', ')}.`,
      );
    }

    const [manager] = matches;

    if (!manager) {
      throw new NotFoundException(`Manager "${normalized}" was not found.`);
    }

    return manager;
  }

  private parseOptionalDate(value: string | null | undefined, field: string) {
    if (!value || !value.trim()) {
      return undefined;
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid date string.`);
    }

    return parsed;
  }

  private normalizeLimit(value: number | null | undefined, fallback: number, max: number) {
    const next = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback;

    if (next < 1) {
      return fallback;
    }

    return Math.min(next, max);
  }

  private endOfDay(value: Date) {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private explainShipmentStatus(deliveryStatusCode: string) {
    switch (deliveryStatusCode) {
      case 'ready_to_ship':
        return 'Відправлення створене та підготовлене до передачі перевізнику.';
      case 'in_transit':
        return 'Відправлення вже в дорозі або рухається мережею перевізника.';
      case 'delivered':
        return 'Відправлення доставлене до точки вручення або видане отримувачу.';
      case 'returned':
        return 'Відправлення повертається або вже повернулося відправнику.';
      case 'failed':
        return 'Перевізник зафіксував невдалу доставку або помилку вручення.';
      case 'pending':
      default:
        return 'Статус відправлення ще не оновлено або він очікує синхронізації.';
    }
  }

  private raiseMissingManagerSelector(): never {
    throw new BadRequestException('managerId or managerQuery is required.');
  }
}
