import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { presentUser, userWithRoleInclude } from '../../users/presenters/user.presenter';
import type { JwtTokenPayload } from '../auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: ReturnType<typeof presentUser>;
    }>();

    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer access token.');
    }

    let payload: JwtTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    if (payload.type !== 'access' || !payload.sub) {
      throw new UnauthorizedException('Invalid access token payload.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: userWithRoleInclude,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or no longer exists.');
    }

    request.user = presentUser(user);
    return true;
  }

  private extractBearerToken(authorizationHeader?: string | string[]) {
    if (!authorizationHeader || Array.isArray(authorizationHeader)) {
      return null;
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
