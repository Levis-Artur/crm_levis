import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { ListReturnsQueryDto } from './dto/list-returns-query.dto';
import { UpdateOrderReturnDto } from './dto/update-order-return.dto';
import { UpdateOrderReturnStatusDto } from './dto/update-order-return-status.dto';
import { ReturnsService } from './returns.service';

type HttpRequestContext = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  listReturns(@Query() query: ListReturnsQueryDto, @CurrentUser() user: PresentedUser) {
    return this.returnsService.listReturns(query, user);
  }

  @Get(':id')
  getReturnById(
    @Param('id', new ParseUUIDPipe()) returnId: string,
    @CurrentUser() user: PresentedUser,
  ) {
    return this.returnsService.getReturnById(returnId, user);
  }

  @Patch(':id')
  updateReturn(
    @Param('id', new ParseUUIDPipe()) returnId: string,
    @Body() dto: UpdateOrderReturnDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.returnsService.updateReturn(
      returnId,
      dto,
      user,
      this.buildAuditContext(request),
    );
  }

  @Patch(':id/status')
  updateReturnStatus(
    @Param('id', new ParseUUIDPipe()) returnId: string,
    @Body() dto: UpdateOrderReturnStatusDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.returnsService.updateReturnStatus(
      returnId,
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
