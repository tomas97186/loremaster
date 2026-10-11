"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { askSessionAssistant, clearSessionAssistantChat } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import type { AiMessage } from "@/lib/ai/gateway";
import { AI_PROVIDER_LABELS } from "@/lib/ai/provider-options";
import type { AiProvider } from "@/lib/db/types";

export function AiAssistantPanel({
  campaignId,
  sessionId,
  aiProvider: defaultProvider,
  initialMessages,
}: {
  campaignId: string;
  sessionId: string;
  aiProvider: AiProvider;
  initialMessages: AiMessage[];
}) {
  const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [provider, setProvider] = useState<AiProvider>(defaultProvider);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scorre in fondo a ogni nuovo messaggio, all'attesa della risposta e al primo caricamento.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending, error]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setInput("");
    setError(null);
    const nextMessages: AiMessage[] = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);

    startTransition(async () => {
      const result = await askSessionAssistant(campaignId, sessionId, nextMessages, provider);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer ?? "" }]);
    });
  }

  function handleClear() {
    if (!window.confirm("Eliminare la cronologia della chat di questa sessione?")) return;
    setMessages([]);
    setError(null);
    startTransition(async () => {
      await clearSessionAssistantChat(campaignId, sessionId);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
          Modello
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AiProvider)}
            disabled={pending}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs normal-case tracking-normal text-text"
          >
            {(Object.keys(AI_PROVIDER_LABELS) as AiProvider[]).map((value) => (
              <option key={value} value={value}>
                {AI_PROVIDER_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        {messages.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={pending}
            className="text-xs text-text-muted hover:text-danger"
          >
            Cancella chat
          </button>
        ) : null}
      </div>

      <div ref={scrollRef} className="mb-4 flex max-h-[60vh] min-h-64 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-text-muted">
            Chiedi qualsiasi cosa su questa sessione: idee per un incontro, come far
            reagire un NPC, riassumere cosa sappiamo finora...
          </p>
        ) : (
          messages.map((message, i) =>
            message.role === "user" ? (
              <div
                key={i}
                className="self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-sm text-white"
              >
                {message.text}
              </div>
            ) : (
              <div
                key={i}
                className="self-start rounded-2xl rounded-bl-sm bg-surface-2 px-4 py-2 text-text"
              >
                <MarkdownMessage text={message.text} />
              </div>
            ),
          )
        )}
        {pending ? <p className="text-xs text-text-muted">L&apos;assistente sta pensando…</p> : null}
      </div>

      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi una domanda…"
          className="min-h-0"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" disabled={pending}>
          Invia
        </Button>
      </form>
    </div>
  );
}
