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
import { FinanceService } from './finance.service';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { CreateManagerPayoutDto } from './dto/create-manager-payout.dto';
import { FinanceSummaryQueryDto } from './dto/finance-summary-query.dto';
import { ListFinancePayoutsQueryDto } from './dto/list-finance-payouts-query.dto';
import { ListFinanceTransactionsQueryDto } from './dto/list-finance-transactions-query.dto';
import { UpdateFinanceTransactionDto } from './dto/update-finance-transaction.dto';

type HttpRequestContext = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getSummary(@Query() query: FinanceSummaryQueryDto) {
    return this.financeService.getAdminFinanceSummary(query);
  }

  @Get('transactions')
  listTransactions(@Query() query: ListFinanceTransactionsQueryDto) {
    return this.financeService.listFinanceTransactions(query);
  }

  @Post('transactions')
  createTransaction(
    @Body() dto: CreateFinanceTransactionDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.financeService.createFinanceTransaction(
      dto,
      user,
      this.buildAuditContext(request),
    );
  }

  @Patch('transactions/:id')
  updateTransaction(
    @Param('id', new ParseUUIDPipe()) transactionId: string,
    @Body() dto: UpdateFinanceTransactionDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.financeService.updateFinanceTransaction(
      transactionId,
      dto,
      user,
      this.buildAuditContext(request),
    );
  }

  @Get('payouts')
  listPayouts(@Query() query: ListFinancePayoutsQueryDto) {
    return this.financeService.listFinancePayouts(query);
  }

  @Post('payouts')
  createPayout(
    @Body() dto: CreateManagerPayoutDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.financeService.createFinancePayout(
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
      userAgent: (Array.isArray(userAgent) ? userAgent[0] : userAgent) ?? null,
    };
  }
}
