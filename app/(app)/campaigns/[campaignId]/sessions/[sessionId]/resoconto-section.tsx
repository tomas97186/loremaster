"use client";

import { useState } from "react";
import { ResocontoForm } from "./resoconto-form";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/card";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import type { MentionableEntity } from "@/lib/richtext";

/** Resoconto in sola lettura per una sessione conclusa, con un pulsante per modificarlo. */
export function ResocontoSection({
  campaignId,
  sessionId,
  summary,
  xpAwarded,
  mentionable,
}: {
  campaignId: string;
  sessionId: string;
  summary: string | null;
  xpAwarded: number | null;
  mentionable: MentionableEntity[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-text">Modifica resoconto</h2>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-text-muted hover:text-text"
          >
            Annulla
          </button>
        </div>
        <ResocontoForm
          campaignId={campaignId}
          sessionId={sessionId}
          summary={summary}
          xpAwarded={xpAwarded}
          autoXp={0}
          mentionable={mentionable}
          showGenerate={false}
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text">Resoconto</h2>
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Modifica resoconto
        </Button>
      </div>
      <div className="mt-3">
        {xpAwarded ? <Badge tone="gold">{xpAwarded} PE</Badge> : null}
        <div className={xpAwarded ? "mt-2" : undefined}>
          <RichTextView html={summary} campaignId={campaignId} />
        </div>
      </div>
    </Card>
  );
}
