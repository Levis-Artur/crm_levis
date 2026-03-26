import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NovaPoshtaApiService } from './nova-poshta-api.service';
import { NovaPoshtaService } from './nova-poshta.service';
import { OrderShipmentsController } from './order-shipments.controller';
import { ShipmentsController } from './shipments.controller';

@Module({
  imports: [AuthModule],
  controllers: [OrderShipmentsController, ShipmentsController],
  providers: [NovaPoshtaApiService, NovaPoshtaService],
})
export class NovaPoshtaModule {}
