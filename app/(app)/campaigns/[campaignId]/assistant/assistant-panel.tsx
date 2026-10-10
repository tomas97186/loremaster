"use client";

import { useState, useTransition } from "react";
import { askCampaignAssistant, type DraftProposal } from "./actions";
import { DraftCard } from "./draft-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { MarkdownMessage } from "@/components/ai/markdown-message";
import type { AiMessage } from "@/lib/ai/gateway";
import type { AiProvider } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

interface UiMessage {
  role: "user" | "assistant";
  text?: string;
  draft?: DraftProposal;
}

const ENTITY_LABEL_IT: Record<DraftProposal["entityType"], string> = {
  npc: "NPC",
  location: "luogo",
  faction: "fazione",
  quest: "quest",
  item: "oggetto",
  character: "personaggio",
};

export function AssistantPanel({
  campaignId,
  mentionable,
  aiProvider,
}: {
  campaignId: string;
  mentionable: MentionableEntity[];
  aiProvider: AiProvider;
}) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function historyFor(uiMessages: UiMessage[]): AiMessage[] {
    return uiMessages.map((m) => ({
      role: m.role,
      text: m.draft ? `[Proposta ${ENTITY_LABEL_IT[m.draft.entityType]}: ${m.draft.label}]` : m.text ?? "",
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setInput("");
    setError(null);
    const nextMessages: UiMessage[] = [...messages, { role: "user", text: question }];
    setMessages(nextMessages);

    startTransition(async () => {
      const result = await askCampaignAssistant(campaignId, historyFor(nextMessages));
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.draft) {
        setMessages((prev) => [...prev, { role: "assistant", draft: result.draft }]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", text: result.answer ?? "" }]);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
        Provider attivo: {aiProvider === "claude" ? "Claude API" : "Gemini (free tier)"} — conosce
        tutti i dati della campagna
      </p>

      <div className="mb-4 flex max-h-[32rem] flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-text-muted">
            Chiedimi idee per la prossima sessione, come far reagire un NPC, o di crearti un
            nuovo NPC, luogo, fazione, quest, oggetto o personaggio: propongo una bozza che puoi
            modificare e salvare.
          </p>
        ) : (
          messages.map((message, i) =>
            message.draft ? (
              <div key={i} className="self-start">
                <DraftCard draft={message.draft} campaignId={campaignId} mentionable={mentionable} />
              </div>
            ) : message.role === "user" ? (
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
                <MarkdownMessage text={message.text ?? ""} />
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
          placeholder="Scrivi una domanda, o chiedi di creare qualcosa…"
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
