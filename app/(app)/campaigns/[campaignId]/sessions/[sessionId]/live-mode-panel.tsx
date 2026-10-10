"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { SessionTimer } from "./session-timer";
import { KeyPointsPanel } from "./key-points-panel";
import { toggleEncounterCompleted } from "../../encounter-actions";
import { Card, Badge } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import { QUEST_STATUS_LABELS, QUEST_STATUS_TONES } from "@/lib/constants";
import { isEmptyHtml } from "@/lib/richtext";
import type { Encounter, SessionKeyPoint } from "@/lib/db/types";

type LiveNpc = {
  id: string;
  name: string;
  role: string | null;
  description: string | null;
  public_notes: string | null;
  dm_notes: string | null;
  image_url: string | null;
};
type LiveLocation = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  public_notes: string | null;
  dm_notes: string | null;
  image_url: string | null;
};
type LiveQuest = {
  id: string;
  title: string;
  status: string;
  description: string | null;
  public_notes: string | null;
  dm_notes: string | null;
};

type Selection =
  | { kind: "npc"; item: LiveNpc }
  | { kind: "location"; item: LiveLocation }
  | { kind: "quest"; item: LiveQuest };

function RichSection({ label, html, campaignId }: { label: string; html: string | null; campaignId: string }) {
  if (isEmptyHtml(html)) return null;
  return (
    <div className="mt-3 border-t border-border pt-3">
      <h3 className="mb-1 font-mono text-[11px] uppercase tracking-wide text-text-muted">{label}</h3>
      <RichTextView html={html} campaignId={campaignId} />
    </div>
  );
}

export function LiveModePanel({
  campaignId,
  sessionId,
  npcs,
  locations,
  quests,
  prepNotes,
  encounters,
  keyPoints,
}: {
  campaignId: string;
  sessionId: string;
  npcs: LiveNpc[];
  locations: LiveLocation[];
  quests: LiveQuest[];
  prepNotes: string | null;
  encounters: Encounter[];
  keyPoints: SessionKeyPoint[];
}) {
  const [selection, setSelection] = useState<Selection | null>(null);

  const editHref =
    selection?.kind === "npc"
      ? `/campaigns/${campaignId}/npcs/${selection.item.id}`
      : selection?.kind === "location"
        ? `/campaigns/${campaignId}/locations/${selection.item.id}/edit`
        : selection?.kind === "quest"
          ? `/campaigns/${campaignId}/quests/${selection.item.id}`
          : null;

  return (
    <div className="space-y-6">
      <SessionTimer />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
              NPC rapidi
            </h3>
            <div className="space-y-2">
              {npcs.map((npc) => (
                <button
                  key={npc.id}
                  type="button"
                  onClick={() => setSelection({ kind: "npc", item: npc })}
                  className="block w-full text-left"
                >
                  <Card className="p-3 hover:border-border-strong">
                    <p className="text-sm font-medium text-text">{npc.name}</p>
                    {npc.role ? <p className="text-xs text-text-muted">{npc.role}</p> : null}
                  </Card>
                </button>
              ))}
              {npcs.length === 0 ? (
                <p className="text-sm text-text-muted">Nessun NPC collegato.</p>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
              Luoghi
            </h3>
            <div className="space-y-2">
              {locations.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setSelection({ kind: "location", item: location })}
                  className="block w-full text-left"
                >
                  <Card className="p-3 hover:border-border-strong">
                    <p className="text-sm font-medium text-text">{location.name}</p>
                    {location.type ? (
                      <p className="text-xs text-text-muted">{location.type}</p>
                    ) : null}
                  </Card>
                </button>
              ))}
              {locations.length === 0 ? (
                <p className="text-sm text-text-muted">Nessun luogo collegato.</p>
              ) : null}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
              Quest
            </h3>
            <div className="space-y-2">
              {quests.map((quest) => (
                <button
                  key={quest.id}
                  type="button"
                  onClick={() => setSelection({ kind: "quest", item: quest })}
                  className="block w-full text-left"
                >
                  <Card className="flex items-center justify-between p-3 hover:border-border-strong">
                    <p className="text-sm font-medium text-text">{quest.title}</p>
                    <Badge tone={QUEST_STATUS_TONES[quest.status]}>
                      {QUEST_STATUS_LABELS[quest.status]}
                    </Badge>
                  </Card>
                </button>
              ))}
              {quests.length === 0 ? (
                <p className="text-sm text-text-muted">Nessuna quest collegata.</p>
              ) : null}
            </div>
          </div>
        </div>

        {!isEmptyHtml(prepNotes) ? (
          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
              Note di preparazione
            </h3>
            <RichTextView html={prepNotes} campaignId={campaignId} />
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Punti chiave
          </h3>
          <KeyPointsPanel campaignId={campaignId} sessionId={sessionId} keyPoints={keyPoints} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Combattimenti
          </h3>
          {encounters.length > 0 ? (
            <div className="space-y-2">
              {encounters.map((encounter, i) => (
                <details key={encounter.id} className="rounded-lg border border-border">
                  <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
                    <form
                      action={toggleEncounterCompleted.bind(
                        null,
                        campaignId,
                        encounter.id,
                        { sessionId },
                        !encounter.completed,
                      )}
                    >
                      <button
                        type="submit"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={encounter.completed ? "Segna come da fare" : "Segna come fatto"}
                        className="flex items-center text-text-muted hover:text-accent"
                      >
                        {encounter.completed ? (
                          <CheckCircle2 size={18} className="text-success" />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>
                    </form>
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
          ) : (
            <p className="text-sm text-text-muted">Nessun combattimento pianificato.</p>
          )}
        </div>

      <Modal
        open={selection !== null}
        onClose={() => setSelection(null)}
        title={
          selection ? (
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold text-text">
                {selection.kind === "quest" ? selection.item.title : selection.item.name}
              </h2>
              {selection.kind === "npc" && selection.item.role ? (
                <Badge>{selection.item.role}</Badge>
              ) : null}
              {selection.kind === "location" && selection.item.type ? (
                <Badge tone="gold" className="normal-case">
                  {selection.item.type}
                </Badge>
              ) : null}
              {selection.kind === "quest" ? (
                <Badge tone={QUEST_STATUS_TONES[selection.item.status]}>
                  {QUEST_STATUS_LABELS[selection.item.status]}
                </Badge>
              ) : null}
            </div>
          ) : null
        }
      >
        {selection ? (
          <div>
            {(selection.kind === "npc" || selection.kind === "location") && selection.item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selection.item.image_url}
                alt=""
                className="mb-3 max-h-48 w-full rounded-lg border border-border object-cover"
              />
            ) : null}
            {isEmptyHtml(selection.item.description) ? (
              <p className="text-sm text-text-muted">Nessuna descrizione ancora.</p>
            ) : (
              <RichTextView html={selection.item.description} campaignId={campaignId} />
            )}
            <RichSection label="Informazioni pubbliche" html={selection.item.public_notes} campaignId={campaignId} />
            <RichSection label="Note del DM" html={selection.item.dm_notes} campaignId={campaignId} />
            {editHref ? (
              <Link
                href={editHref}
                className="mt-4 inline-block text-sm text-accent underline"
              >
                Apri pagina completa
              </Link>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
