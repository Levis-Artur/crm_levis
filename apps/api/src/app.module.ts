import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HealthModule } from './modules/health/health.module';
import { NovaPoshtaModule } from './modules/nova-poshta/nova-poshta.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
      cache: true,
      validate: validateEnv,
    }),
    PrismaModule,
    RolesModule,
    AuthModule,
    AiModule,
    FinanceModule,
    UsersModule,
    OrdersModule,
    NovaPoshtaModule,
    ReturnsModule,
    HealthModule,
  ],
})
export class AppModule {}
