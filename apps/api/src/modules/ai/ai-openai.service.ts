import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OpenAiErrorPayload, OpenAiResponseRecord } from './ai.types';

@Injectable()
export class AiOpenAiService {
  constructor(private readonly configService: ConfigService) {}

  isEnabled() {
    return this.configService.get<boolean>('AI_CHAT_ENABLED') ?? false;
  }

  getModel() {
    return this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-5-mini';
  }

  async createResponse(payload: Record<string, unknown>) {
    this.assertEnabled();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const response = await fetch(`${this.getBaseUrl()}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = (await response.json()) as OpenAiResponseRecord & OpenAiErrorPayload;

      if (!response.ok) {
        throw new BadGatewayException(this.extractErrorMessage(data));
      }

      return data;
    } catch (error) {
      if (
        error instanceof BadGatewayException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      throw new BadGatewayException('OpenAI Responses API request failed.');
    } finally {
      clearTimeout(timeout);
    }
  }

  private assertEnabled() {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('AI chat is disabled.');
    }
  }

  private getApiKey() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();

    if (!apiKey) {
      throw new ServiceUnavailableException('AI chat is missing OPENAI_API_KEY.');
    }

    return apiKey;
  }

  private getBaseUrl() {
    return this.configService.get<string>('OPENAI_API_BASE_URL') ?? 'https://api.openai.com/v1';
  }

  private getTimeoutMs() {
    return Number(this.configService.get<number>('OPENAI_REQUEST_TIMEOUT_MS') ?? 30000);
  }

  private extractErrorMessage(payload: OpenAiErrorPayload) {
    return payload.error?.message?.trim() || 'OpenAI Responses API request failed.';
  }
}
