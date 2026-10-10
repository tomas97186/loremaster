"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { addSessionKeyPoint, toggleSessionKeyPoint, deleteSessionKeyPoint } from "../actions";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SessionKeyPoint } from "@/lib/db/types";

export function KeyPointsPanel({
  campaignId,
  sessionId,
  keyPoints,
}: {
  campaignId: string;
  sessionId: string;
  keyPoints: SessionKeyPoint[];
}) {
  return (
    <div>
      <form
        action={addSessionKeyPoint.bind(null, campaignId, sessionId)}
        className="mb-4 flex gap-2"
      >
        <Input type="text" name="content" placeholder="Punto chiave…" required autoComplete="off" />
        <SubmitButton size="sm" pendingText="Aggiunta…">
          Aggiungi
        </SubmitButton>
      </form>
      {keyPoints.length > 0 ? (
        <ul className="space-y-2">
          {keyPoints.map((point) => (
            <li
              key={point.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <div className="flex items-start gap-2">
                <form action={toggleSessionKeyPoint.bind(null, campaignId, sessionId, point.id, !point.done)}>
                  <button
                    type="submit"
                    aria-label={point.done ? "Segna come da fare" : "Segna come fatto"}
                    className="mt-0.5 flex items-center text-text-muted hover:text-accent"
                  >
                    {point.done ? (
                      <CheckCircle2 size={18} className="text-success" />
                    ) : (
                      <Circle size={18} />
                    )}
                  </button>
                </form>
                <p className={point.done ? "text-sm text-text-muted line-through" : "text-sm text-text"}>
                  {point.content}
                </p>
              </div>
              <form action={deleteSessionKeyPoint.bind(null, campaignId, sessionId, point.id)}>
                <button type="submit" className="text-xs text-text-muted hover:text-danger">
                  Elimina
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">Nessun punto chiave ancora.</p>
      )}
    </div>
  );
}
