import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReturnsModule } from '../returns/returns.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, ReturnsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
