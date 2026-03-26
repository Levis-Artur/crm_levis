import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { MeFinanceController } from './me-finance.controller';

@Module({
  imports: [AuthModule],
  controllers: [MeFinanceController, FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
