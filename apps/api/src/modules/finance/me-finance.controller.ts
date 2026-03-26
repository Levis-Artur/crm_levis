import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../roles/role-code.enum';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { FinanceService } from './finance.service';
import { ListManagerEarningsQueryDto } from './dto/list-manager-earnings-query.dto';
import { ListManagerPayoutsQueryDto } from './dto/list-manager-payouts-query.dto';

@Controller('me/finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.MANAGER)
export class MeFinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: PresentedUser) {
    return this.financeService.getManagerFinanceSummary(user);
  }

  @Get('earnings')
  getEarnings(@Query() query: ListManagerEarningsQueryDto, @CurrentUser() user: PresentedUser) {
    return this.financeService.listManagerEarnings(query, user);
  }

  @Get('payouts')
  getPayouts(@Query() query: ListManagerPayoutsQueryDto, @CurrentUser() user: PresentedUser) {
    return this.financeService.listManagerPayouts(query, user);
  }
}
