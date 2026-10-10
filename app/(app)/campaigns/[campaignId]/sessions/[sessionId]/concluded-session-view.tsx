import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { ResocontoSection } from "./resoconto-section";
import { Card, Badge } from "@/components/ui/card";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import { isEmptyHtml, mentionHref, ENTITY_TYPE_LABELS, type MentionableEntity } from "@/lib/richtext";
import type { Encounter, SessionNote, SessionKeyPoint, SessionLinkEntityType } from "@/lib/db/types";

function RichSection({ label, html, campaignId }: { label: string; html: string | null; campaignId: string }) {
  if (isEmptyHtml(html)) return null;
  return (
    <div className="mt-3 border-t border-border pt-3">
      <h3 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-text-muted">{label}</h3>
      <RichTextView html={html} campaignId={campaignId} />
    </div>
  );
}

const LINKED_TYPES_ORDER: SessionLinkEntityType[] = [
  "npc",
  "location",
  "quest",
  "character",
  "faction",
  "item",
];

/**
 * Vista di sola lettura per una sessione conclusa (resoconto già scritto):
 * tutte le informazioni importanti raccolte in un'unica pagina, senza tab né
 * assistente AI. Solo il resoconto resta modificabile.
 */
export function ConcludedSessionView({
  campaignId,
  sessionId,
  prepNotes,
  encounters,
  keyPoints,
  linkedByType,
  notes,
  summary,
  xpAwarded,
  mentionable,
}: {
  campaignId: string;
  sessionId: string;
  prepNotes: string | null;
  encounters: Encounter[];
  keyPoints: SessionKeyPoint[];
  linkedByType: Record<SessionLinkEntityType, { id: string; name: string }[]>;
  notes: SessionNote[];
  summary: string | null;
  xpAwarded: number | null;
  mentionable: MentionableEntity[];
}) {
  const hasLinked = LINKED_TYPES_ORDER.some((type) => linkedByType[type].length > 0);

  return (
    <div className="space-y-6">
      {!isEmptyHtml(prepNotes) ? (
        <Card>
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Note di preparazione
          </h2>
          <RichTextView html={prepNotes} campaignId={campaignId} />
        </Card>
      ) : null}

      {keyPoints.length > 0 ? (
        <Card>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Punti chiave
          </h2>
          <ul className="space-y-2">
            {keyPoints.map((point) => (
              <li key={point.id} className="flex items-start gap-2">
                {point.done ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <Circle size={16} className="mt-0.5 shrink-0 text-text-muted" />
                )}
                <p
                  className={
                    point.done ? "text-sm text-text-muted line-through" : "text-sm text-text"
                  }
                >
                  {point.content}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {encounters.length > 0 ? (
        <Card>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Combattimenti
          </h2>
          <div className="space-y-2">
            {encounters.map((encounter, i) => (
              <details key={encounter.id} className="rounded-lg border border-border">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
                  {encounter.completed ? (
                    <CheckCircle2 size={16} className="shrink-0 text-success" />
                  ) : (
                    <Circle size={16} className="shrink-0 text-text-muted" />
                  )}
                  <span
                    className={
                      encounter.completed
                        ? "text-sm text-text-muted line-through"
                        : "text-sm font-medium text-text"
                    }
                  >
                    {encounter.name || `Combattimento ${i + 1}`}
                  </span>
                  {encounter.xp ? (
                    <Badge tone="gold" className="ml-auto">
                      {encounter.xp} PE
                    </Badge>
                  ) : null}
                </summary>
                {!isEmptyHtml(encounter.enemies) || !isEmptyHtml(encounter.rewards) ? (
                  <div className="space-y-2 border-t border-border p-3">
                    <RichSection label="Nemici" html={encounter.enemies} campaignId={campaignId} />
                    <RichSection label="Premi" html={encounter.rewards} campaignId={campaignId} />
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        </Card>
      ) : null}

      {hasLinked ? (
        <Card>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Elementi collegati
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {LINKED_TYPES_ORDER.filter((type) => linkedByType[type].length > 0).map((type) => (
              <div key={type}>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
                  {ENTITY_TYPE_LABELS[type]}
                </p>
                <ul className="space-y-1">
                  {linkedByType[type].map((item) => (
                    <li key={item.id}>
                      <Link
                        href={mentionHref(campaignId, type, item.id)}
                        className="block rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:border-border-strong"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {notes.length > 0 ? (
        <Card>
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Note rapide
          </h2>
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                <p className="text-sm text-text">{note.content}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <ResocontoSection
        campaignId={campaignId}
        sessionId={sessionId}
        summary={summary}
        xpAwarded={xpAwarded}
        mentionable={mentionable}
      />
    </div>
  );
}
