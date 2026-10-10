"use client";

import { useState, useTransition } from "react";
import { askSessionAssistant } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import type { AiMessage } from "@/lib/ai/gateway";
import type { AiProvider } from "@/lib/db/types";

export function AiAssistantPanel({
  campaignId,
  sessionId,
  aiProvider,
}: {
  campaignId: string;
  sessionId: string;
  aiProvider: AiProvider;
}) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setInput("");
    setError(null);
    const nextMessages: AiMessage[] = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);

    startTransition(async () => {
      const result = await askSessionAssistant(campaignId, sessionId, nextMessages);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer ?? "" }]);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
        Provider attivo: {aiProvider === "claude" ? "Claude API" : "Gemini (free tier)"}
      </p>

      <div className="mb-4 flex max-h-96 flex-col gap-3 overflow-y-auto">
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
