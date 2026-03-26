import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FinanceModule } from '../finance/finance.module';
import { OrdersModule } from '../orders/orders.module';
import { AiController } from './ai.controller';
import { AiOpenAiService } from './ai-openai.service';
import { AiService } from './ai.service';
import { AiToolsService } from './ai.tools';

@Module({
  imports: [AuthModule, OrdersModule, FinanceModule],
  controllers: [AiController],
  providers: [AiOpenAiService, AiToolsService, AiService],
})
export class AiModule {}
