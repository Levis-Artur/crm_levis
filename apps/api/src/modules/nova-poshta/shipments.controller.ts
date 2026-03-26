import {
  Controller,
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
import { NovaPoshtaService } from './nova-poshta.service';

type HttpRequestContext = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Controller('shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
export class ShipmentsController {
  constructor(private readonly novaPoshtaService: NovaPoshtaService) {}

  @Post(':id/sync')
  syncShipment(
    @Param('id', new ParseUUIDPipe()) shipmentId: string,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.novaPoshtaService.syncShipment(
      shipmentId,
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
      userAgent: (Array.isArray(userAgent) ? userAgent[0] : userAgent) ?? null,
    };
  }
}
