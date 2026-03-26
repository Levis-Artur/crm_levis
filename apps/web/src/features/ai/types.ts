export interface AiChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatMessage extends AiChatHistoryMessage {
  id: string;
  toolsUsed?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

export interface AiChatResponse {
  message: string;
  toolsUsed: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

export interface AiCapabilitiesResponse {
  tools: Array<{
    name: string;
    description: string;
  }>;
  allowed: string[];
  forbidden: string[];
}
