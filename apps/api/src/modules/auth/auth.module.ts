import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { HashService } from './services/hash.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, HashService, JwtAuthGuard, RolesGuard],
  exports: [JwtModule, HashService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
