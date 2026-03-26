import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../roles/role-code.enum';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { CreateOrderShipmentDto } from './dto/create-order-shipment.dto';
import { NovaPoshtaService } from './nova-poshta.service';

type HttpRequestContext = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
export class OrderShipmentsController {
  constructor(private readonly novaPoshtaService: NovaPoshtaService) {}

  @Post(':id/shipment/create')
  createShipment(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() dto: CreateOrderShipmentDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.novaPoshtaService.createShipmentFromOrder(
      orderId,
      dto,
      user,
      this.buildAuditContext(request),
    );
  }

  @Get(':id/shipment')
  getOrderShipment(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @CurrentUser() user: PresentedUser,
  ) {
    return this.novaPoshtaService.getOrderShipment(orderId, user);
  }

  private buildAuditContext(request: HttpRequestContext) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const userAgent = request.headers['user-agent'];

    return {
      ipAddress:
        (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim() ??
        request.ip ??
        null,
      userAgent: (Array.isArray(userAgent) ? userAgent[0] : userAgent) ?? null,
    };
  }
}
