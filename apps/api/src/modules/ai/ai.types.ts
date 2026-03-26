import type { PresentedUser } from '../users/presenters/user.presenter';

export type AiChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AiToolCallLog = {
  name: string;
  arguments: Record<string, unknown>;
};

export type AiChatResult = {
  message: string;
  toolsUsed: AiToolCallLog[];
};

export type AiAuditContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

export type AiChatContext = {
  currentUser: PresentedUser;
  auditContext: AiAuditContext;
};

export type AiCapability = {
  name: string;
  description: string;
};

export type AiCapabilitiesResponse = {
  tools: AiCapability[];
  allowed: string[];
  forbidden: string[];
};

export type OpenAiResponseMessageItem = {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<
    | {
        type: 'output_text';
        text: string;
      }
    | {
        type: string;
        [key: string]: unknown;
      }
  >;
};

export type OpenAiResponseFunctionCallItem = {
  id: string;
  type: 'function_call';
  call_id: string;
  name: string;
  arguments: string;
};

export type OpenAiResponseOutputItem =
  | OpenAiResponseMessageItem
  | OpenAiResponseFunctionCallItem
  | {
      id?: string;
      type: string;
      [key: string]: unknown;
    };

export type OpenAiResponseRecord = {
  id: string;
  output?: OpenAiResponseOutputItem[];
  output_text?: string;
};

export type OpenAiErrorPayload = {
  error?: {
    message?: string;
    type?: string;
  };
};
