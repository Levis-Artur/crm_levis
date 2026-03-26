import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../roles/role-code.enum';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { AiService } from './ai.service';
import { AiChatDto } from './dto/ai-chat.dto';

type HttpRequestContext = {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};

@Controller('ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.MANAGER)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  chat(
    @Body() dto: AiChatDto,
    @CurrentUser() user: PresentedUser,
    @Req() request: HttpRequestContext,
  ) {
    return this.aiService.chat(dto, {
      currentUser: user,
      auditContext: this.buildAuditContext(request),
    });
  }

  @Get('chat/capabilities')
  getCapabilities() {
    return this.aiService.getCapabilities();
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
