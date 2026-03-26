import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { PresentedUser } from '../users/presenters/user.presenter';
import { AiOpenAiService } from './ai-openai.service';
import { AI_CAPABILITIES, AiToolsService } from './ai.tools';
import type {
  AiCapabilitiesResponse,
  AiChatContext,
  AiChatHistoryMessage,
  AiChatResult,
  AiToolCallLog,
  OpenAiResponseFunctionCallItem,
  OpenAiResponseMessageItem,
  OpenAiResponseOutputItem,
  OpenAiResponseRecord,
} from './ai.types';
import { AiChatDto } from './dto/ai-chat.dto';

const MAX_TOOL_ITERATIONS = 5;

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiOpenAiService: AiOpenAiService,
    private readonly aiToolsService: AiToolsService,
  ) {}

  getCapabilities(): AiCapabilitiesResponse {
    return {
      tools: AI_CAPABILITIES,
      allowed: [
        'Пошук активних замовлень та проблемних кейсів',
        'Пояснення стану замовлення, повернення або відправлення',
        'Зведення фінансів менеджера',
        'Зведення фінансів компанії для адміністратора',
        'Чернетка короткого повідомлення клієнту',
      ],
      forbidden: [
        'Видалення записів',
        'Зміна ролей користувачів',
        'Проведення виплат',
        'Створення або оновлення замовлень, повернень і фінансових записів',
        'Довільне виконання коду',
      ],
    };
  }

  async chat(dto: AiChatDto, context: AiChatContext): Promise<AiChatResult> {
    const input = this.buildConversationInput(dto.message, dto.history ?? [], context.currentUser);
    const toolsUsed: AiToolCallLog[] = [];

    let response = await this.aiOpenAiService.createResponse({
      model: this.aiOpenAiService.getModel(),
      instructions: this.buildSystemInstructions(context.currentUser),
      input,
      tools: this.aiToolsService.getToolDefinitions(),
      tool_choice: 'auto',
      max_output_tokens: 900,
    });

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
      const functionCalls = this.getFunctionCalls(response);

      if (functionCalls.length === 0) {
        const message = this.extractAssistantText(response);

        if (!message) {
          throw new BadRequestException('AI response did not include assistant text.');
        }

        await this.logChat(context, dto.message, toolsUsed, message);

        return {
          message,
          toolsUsed,
        };
      }

      const toolOutputs = await Promise.all(
        functionCalls.map(async (call) => {
          const parsedArguments = this.parseToolArguments(call);
          toolsUsed.push({
            name: call.name,
            arguments: parsedArguments,
          });

          try {
            const result = await this.aiToolsService.executeTool(
              call.name,
              parsedArguments,
              context.currentUser,
            );

            return {
              type: 'function_call_output',
              call_id: call.call_id,
              output: JSON.stringify({
                ok: true,
                result,
              }),
            };
          } catch (error) {
            return {
              type: 'function_call_output',
              call_id: call.call_id,
              output: JSON.stringify({
                ok: false,
                error: this.getErrorMessage(error),
              }),
            };
          }
        }),
      );

      response = await this.aiOpenAiService.createResponse({
        model: this.aiOpenAiService.getModel(),
        previous_response_id: response.id,
        input: toolOutputs,
        tools: this.aiToolsService.getToolDefinitions(),
        tool_choice: 'auto',
        max_output_tokens: 900,
      });
    }

    throw new BadRequestException('AI chat exceeded the maximum number of tool iterations.');
  }

  private buildSystemInstructions(currentUser: PresentedUser) {
    return [
      'Ти внутрішній CRM-помічник компанії.',
      'Відповідай тільки українською мовою.',
      'Не вигадуй дані, номери замовлень або стани. Якщо даних не вистачає, прямо скажи про це.',
      'Працюй тільки через доступні функції. Не стверджуй, що ти щось змінив у CRM, якщо це не підтримується.',
      'Ти не можеш видаляти записи, змінювати ролі, проводити виплати або змінювати бізнес-дані.',
      'Коли використовуєш дані з CRM, спирайся лише на результати функцій.',
      'Якщо дія заборонена або користувач не має доступу, поясни обмеження без спроб обійти його.',
      'Відповіді тримай короткими, практичними та структурованими.',
      `Поточний користувач: ${currentUser.firstName} ${currentUser.lastName}. Роль: ${currentUser.roleCode}.`,
      currentUser.roleCode === 'admin'
        ? 'Користувач-адміністратор може бачити глобальні дані CRM.'
        : 'Користувач-менеджер може бачити тільки власні дані CRM.',
    ].join('\n');
  }

  private buildConversationInput(
    message: string,
    history: AiChatHistoryMessage[],
    currentUser: PresentedUser,
  ) {
    const normalizedHistory = history
      .map((entry) => ({
        role: entry.role,
        content: entry.content.trim(),
      }))
      .filter((entry) => entry.content.length > 0)
      .slice(-12);

    const transcript = normalizedHistory
      .map((entry) =>
        entry.role === 'assistant'
          ? `Помічник: ${entry.content}`
          : `Користувач: ${entry.content}`,
      )
      .join('\n\n');

    return [
      `Контекст сеансу CRM для ${currentUser.firstName} ${currentUser.lastName} (${currentUser.roleCode}).`,
      transcript ? `Історія діалогу:\n${transcript}` : null,
      `Нове повідомлення користувача:\n${message.trim()}`,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  private getFunctionCalls(response: OpenAiResponseRecord) {
    return (response.output ?? []).filter(
      (item): item is OpenAiResponseFunctionCallItem => item.type === 'function_call',
    );
  }

  private extractAssistantText(response: OpenAiResponseRecord) {
    const directText = response.output_text?.trim();

    if (directText) {
      return directText;
    }

    const texts: string[] = [];

    for (const item of response.output ?? []) {
      if (!this.isMessageItem(item)) {
        continue;
      }

      for (const content of item.content) {
        if (content.type === 'output_text' && typeof content.text === 'string') {
          const trimmed = content.text.trim();

          if (trimmed) {
            texts.push(trimmed);
          }
        }
      }
    }

    return texts.join('\n\n').trim();
  }

  private isMessageItem(item: OpenAiResponseOutputItem): item is OpenAiResponseMessageItem {
    return item.type === 'message' && Array.isArray((item as { content?: unknown }).content);
  }

  private parseToolArguments(call: OpenAiResponseFunctionCallItem) {
    if (!call.arguments?.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(call.arguments) as Record<string, unknown>;
      return parsed ?? {};
    } catch {
      throw new BadRequestException(
        `AI tool "${call.name}" returned invalid JSON arguments.`,
      );
    }
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Tool execution failed.';
  }

  private async logChat(
    context: AiChatContext,
    prompt: string,
    toolsUsed: AiToolCallLog[],
    answer: string,
  ) {
    const changes: Prisma.InputJsonValue = {
      prompt,
      toolsUsed: toolsUsed as Prisma.InputJsonValue,
      answerPreview: answer.slice(0, 600),
    };

    await this.prisma.auditLog.create({
      data: {
        actorId: context.currentUser.id,
        entityType: 'ai_chat',
        entityId: randomUUID(),
        action: 'chat',
        summary: `AI assistant processed a chat request using ${toolsUsed.length} tool call(s).`,
        changes,
        metadata: {
          roleCode: context.currentUser.roleCode,
        },
        ipAddress: context.auditContext.ipAddress,
        userAgent: context.auditContext.userAgent,
      },
    });
  }
}
