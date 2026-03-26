'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { translateApiMessage, t } from '@/lib/i18n';
import type { AppRole } from '@/lib/auth/types';
import type {
  AiCapabilitiesResponse,
  AiChatMessage,
  AiChatResponse,
} from '../types';

const STORAGE_KEY = 'crm-ai-chat-session';

interface AssistantChatProps {
  roleCode: AppRole;
}

export function AssistantChat({ roleCode }: AssistantChatProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [capabilities, setCapabilities] = useState<AiCapabilitiesResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const suggestionPrompts = useMemo(
    () => [
      ...t.assistant.suggestions.common,
      ...(roleCode === 'admin'
        ? t.assistant.suggestions.admin
        : t.assistant.suggestions.manager),
    ],
    [roleCode],
  );

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as AiChatMessage[];

      if (Array.isArray(parsed)) {
        setMessages(
          parsed.filter(
            (item): item is AiChatMessage =>
              !!item &&
              (item.role === 'user' || item.role === 'assistant') &&
              typeof item.content === 'string',
          ),
        );
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    void loadCapabilities();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  async function loadCapabilities() {
    try {
      const response = await fetch('/api/ai/chat/capabilities', {
        method: 'GET',
        cache: 'no-store',
      });
      const data = (await response.json()) as AiCapabilitiesResponse;

      if (response.ok) {
        setCapabilities(data);
      }
    } catch {
      setCapabilities(null);
    }
  }

  async function submitMessage(message: string) {
    const normalized = message.trim();

    if (!normalized || isPending) {
      return;
    }

    const nextUserMessage: AiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: normalized,
    };

    const history = messages.map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setMessages((current) => [...current, nextUserMessage]);
    setInput('');
    setError(null);
    setIsPending(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: normalized,
          history,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (AiChatResponse & { message?: string | string[] })
        | null;

      if (!response.ok || !payload || typeof payload.message !== 'string') {
        throw new Error(translateApiMessage(payload?.message));
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: payload.message,
          toolsUsed: payload.toolsUsed,
        },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error && requestError.message.trim()
          ? requestError.message
          : t.common.genericError;
      setError(message);
      setMessages((current) => current.filter((entry) => entry.id !== nextUserMessage.id));
      setInput(normalized);
    } finally {
      setIsPending(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setError(null);
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="min-h-[640px]">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{t.assistant.chatTitle}</CardTitle>
              <CardDescription>{t.assistant.chatDescription}</CardDescription>
            </div>
            <Button variant="outline" onClick={resetConversation} disabled={messages.length === 0 && !error}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {t.assistant.sessionReset}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex h-[calc(100%-108px)] flex-col gap-5 pt-6">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-secondary/20 px-5 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t.assistant.emptyTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t.assistant.emptyDescription}
                </p>
              </div>
            ) : null}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isPending ? (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="max-w-3xl rounded-3xl border border-border/70 bg-secondary/20 px-4 py-3 text-sm text-muted-foreground">
                  {t.assistant.sending}
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="font-semibold">{t.assistant.errorTitle}</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : null}

          <div className="space-y-3 border-t border-border/70 pt-4">
            <label className="text-sm font-medium text-foreground" htmlFor="assistant-input">
              {t.assistant.inputLabel}
            </label>
            <Textarea
              id="assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.assistant.inputPlaceholder}
              className="min-h-[120px]"
              disabled={isPending}
            />
            <div className="flex flex-wrap gap-2">
              {suggestionPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => setInput(prompt)}
                  disabled={isPending}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => void submitMessage(input)} disabled={isPending || !input.trim()}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.assistant.sending}
                  </>
                ) : (
                  t.assistant.send
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.assistant.capabilitiesTitle}</CardTitle>
            <CardDescription>{t.assistant.capabilitiesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-foreground">{t.assistant.allowedTitle}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(capabilities?.allowed ?? []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t.assistant.forbiddenTitle}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(capabilities?.forbidden ?? []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.assistant.toolsTitle}</CardTitle>
            <CardDescription>
              {capabilities ? t.assistant.capabilitiesDescription : t.assistant.noCapabilities}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(capabilities?.tools ?? []).map((tool) => (
              <div key={tool.name} className="rounded-2xl border border-border/70 bg-secondary/15 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AiChatMessage }) {
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-3xl rounded-3xl px-4 py-3 ${
          isAssistant
            ? 'border border-border/70 bg-secondary/20'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        <p
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${
            isAssistant ? 'text-muted-foreground' : 'text-primary-foreground/80'
          }`}
        >
          {isAssistant ? t.assistant.assistantLabel : t.assistant.userLabel}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7">{message.content}</p>
        {isAssistant && message.toolsUsed && message.toolsUsed.length > 0 ? (
          <div className="mt-3 border-t border-border/70 pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {t.assistant.toolLabel}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {message.toolsUsed.map((tool) => (
                <span
                  key={`${message.id}-${tool.name}`}
                  className="rounded-full bg-background px-3 py-1 text-xs text-muted-foreground"
                >
                  {tool.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
