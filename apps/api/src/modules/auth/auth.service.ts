import { UnauthorizedException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { presentUser, userWithRoleInclude } from '../users/presenters/user.presenter';
import { normalizeEmail, normalizePhone } from '../users/utils/user-identity.util';
import type { JwtTokenPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import { HashService } from './services/hash.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    if (!identifier) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalizeEmail(identifier) }, { phone: normalizePhone(identifier) }],
      },
      include: userWithRoleInclude,
    });

    if (!user || !user.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await this.hashService.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.issueTokens(user.id, user.roleCode);
    const refreshTokenHash = await this.hashService.hash(tokens.refreshToken);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshTokenHash,
      },
      include: userWithRoleInclude,
    });

    return this.buildAuthResponse(updatedUser, tokens);
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: JwtTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtTokenPayload>(dto.refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Invalid refresh token payload.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: userWithRoleInclude,
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token is not valid.');
    }

    const matches = await this.hashService.compare(dto.refreshToken, user.refreshTokenHash);

    if (!matches) {
      throw new UnauthorizedException('Refresh token is not valid.');
    }

    const tokens = await this.issueTokens(user.id, user.roleCode);
    const refreshTokenHash = await this.hashService.hash(tokens.refreshToken);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
      include: userWithRoleInclude,
    });

    return this.buildAuthResponse(updatedUser, tokens);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { success: true };
  }

  private async issueTokens(userId: string, roleCode: string) {
    const accessPayload: JwtTokenPayload = {
      sub: userId,
      role: roleCode,
      type: 'access',
    };

    const refreshPayload: JwtTokenPayload = {
      sub: userId,
      role: roleCode,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.getJwtExpiresIn('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.getJwtExpiresIn('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private buildAuthResponse(
    user: Parameters<typeof presentUser>[0],
    tokens: { accessToken: string; refreshToken: string },
  ) {
    return {
      user: presentUser(user),
      tokenType: 'Bearer',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessTokenExpiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
      refreshTokenExpiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    };
  }

  private getJwtExpiresIn(
    key: 'JWT_ACCESS_EXPIRES_IN' | 'JWT_REFRESH_EXPIRES_IN',
  ): StringValue {
    return this.configService.getOrThrow<StringValue>(key);
  }
}
