import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../roles/role-code.enum';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { MoveOrderToReturnDto } from '../returns/dto/move-order-to-return.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
import { ReturnsService } from '../returns/returns.service';

type HttpRequestContext = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly returnsService: ReturnsService,
  ) {}

  @Get()
  listOrders(@Query() query: ListOrdersQueryDto, @CurrentUser() user: PresentedUser) {
    return this.ordersService.listOrders(query, user);
  }

  @Post()
  createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.ordersService.createOrder(dto, user, this.buildAuditContext(request));
  }

  @Get(':id')
  getOrder(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @CurrentUser() user: PresentedUser,
  ) {
    return this.ordersService.getOrderById(orderId, user);
  }

  @Patch(':id')
  updateOrder(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.ordersService.updateOrder(orderId, dto, user, this.buildAuditContext(request));
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.ordersService.updateOrderStatus(
      orderId,
      dto,
      user,
      this.buildAuditContext(request),
    );
  }

  @Post(':id/move-to-return')
  moveOrderToReturn(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() dto: MoveOrderToReturnDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.returnsService.moveOrderToReturn(
      orderId,
      dto,
      user,
      this.buildAuditContext(request),
    );
  }

  private buildAuditContext(request: HttpRequestContext) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const userAgent = request.headers['user-agent'];

    return {
      ipAddress:
        (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ??
        request.ip ??
        null,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent ?? null,
    };
  }
}
