import Link from "next/link";
import { MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import type { Npc, Quest, Item, Session, NpcNote } from "@/lib/db/types";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import { RelatedSection } from "@/components/entity-related-section";
import { NpcNotes } from "../npc-notes";
import { QUEST_STATUS_LABELS } from "@/lib/constants";
import { isEmptyHtml } from "@/lib/richtext";

export default async function NpcViewPage({
  params,
}: {
  params: Promise<{ campaignId: string; npcId: string }>;
}) {
  const { campaignId, npcId } = await params;
  const supabase = await createClient();

  const [{ data: npc }, { data: questLinks }, { data: itemsOwned }, { data: npcLinks }, { data: notes }] =
    await Promise.all([
      supabase.from("npcs").select("*").eq("id", npcId).single<Npc>(),
      supabase
        .from("quest_links")
        .select("quest_id")
        .eq("entity_type", "npc")
        .eq("entity_id", npcId),
      supabase
        .from("items")
        .select("id, name, item_type")
        .eq("owner_npc_id", npcId)
        .order("name")
        .returns<Pick<Item, "id" | "name" | "item_type">[]>(),
      supabase
        .from("session_links")
        .select("session_id")
        .eq("campaign_id", campaignId)
        .eq("entity_type", "npc")
        .eq("entity_id", npcId),
      supabase
        .from("npc_notes")
        .select("*")
        .eq("npc_id", npcId)
        .order("created_at", { ascending: false })
        .returns<NpcNote[]>(),
    ]);

  if (!npc) notFound();

  const [location, faction] = await Promise.all([
    npc.location_id
      ? supabase
          .from("locations")
          .select("id, name")
          .eq("id", npc.location_id)
          .maybeSingle<{ id: string; name: string }>()
          .then((r) => r.data)
      : Promise.resolve(null),
    npc.faction_id
      ? supabase
          .from("factions")
          .select("id, name")
          .eq("id", npc.faction_id)
          .maybeSingle<{ id: string; name: string }>()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const questIds = (questLinks ?? []).map((l) => l.quest_id as string);
  const { data: questsHere } = questIds.length
    ? await supabase
        .from("quests")
        .select("id, title, status")
        .in("id", questIds)
        .order("title")
        .returns<Pick<Quest, "id" | "title" | "status">[]>()
    : { data: [] as Pick<Quest, "id" | "title" | "status">[] };

  const sessionIds = (npcLinks ?? []).map((l) => l.session_id as string);
  const { data: sessionsHere } = sessionIds.length
    ? await supabase
        .from("sessions")
        .select("id, title, session_number")
        .in("id", sessionIds)
        .order("session_number")
        .returns<Pick<Session, "id" | "title" | "session_number">[]>()
    : { data: [] as Pick<Session, "id" | "title" | "session_number">[] };

  const hasAnyLinks =
    (itemsOwned?.length ?? 0) > 0 ||
    (questsHere?.length ?? 0) > 0 ||
    (sessionsHere?.length ?? 0) > 0 ||
    !!location ||
    !!faction;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {npc.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={npc.image_url}
            alt={npc.name}
            className="w-full shrink-0 rounded-xl border border-border sm:sticky sm:top-6 sm:w-64"
          />
        ) : null}

        <div className="min-w-0 flex-1 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl font-semibold text-text">{npc.name}</h1>
                {npc.role ? (
                  <Badge tone="gold" className="normal-case">
                    {npc.role}
                  </Badge>
                ) : null}
              </div>
              {location ? (
                <Link
                  href={`/campaigns/${campaignId}/locations/${location.id}`}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text"
                >
                  <MapPin size={13} />
                  {location.name}
                </Link>
              ) : null}
            </div>
            <ButtonLink href={`/campaigns/${campaignId}/npcs/${npcId}/edit`} variant="secondary" size="sm">
              Modifica
            </ButtonLink>
          </div>

          <Card>
            {isEmptyHtml(npc.description) ? (
              <p className="text-sm text-text-muted">Nessuna descrizione ancora.</p>
            ) : (
              <RichTextView html={npc.description} campaignId={campaignId} />
            )}
            {npc.public_notes ? (
              <div className="mt-4 border-t border-border pt-4">
                <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
                  Informazioni pubbliche
                </h2>
                <RichTextView html={npc.public_notes} campaignId={campaignId} />
              </div>
            ) : null}
            {npc.dm_notes ? (
              <div className="mt-4 border-t border-border pt-4">
                <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
                  Note del DM
                </h2>
                <RichTextView html={npc.dm_notes} campaignId={campaignId} />
              </div>
            ) : null}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <RelatedSection
                title="Fazione"
                items={faction ? [{ id: faction.id, name: faction.name }] : []}
                basePath={`/campaigns/${campaignId}/factions`}
                emptyLabel="Nessuna fazione."
              />
            </Card>
            <Card>
              <RelatedSection
                title="Oggetti posseduti"
                items={(itemsOwned ?? []).map((i) => ({ id: i.id, name: i.name, sub: i.item_type }))}
                basePath={`/campaigns/${campaignId}/items`}
                emptyLabel="Nessun oggetto posseduto."
              />
            </Card>
            <Card>
              <RelatedSection
                title="Quest coinvolte"
                items={(questsHere ?? []).map((q) => ({
                  id: q.id,
                  name: q.title,
                  sub: QUEST_STATUS_LABELS[q.status],
                }))}
                basePath={`/campaigns/${campaignId}/quests`}
                emptyLabel="Nessuna quest coinvolge questo NPC."
              />
            </Card>
            <Card>
              <RelatedSection
                title="Sessioni in cui è comparso"
                items={(sessionsHere ?? []).map((s) => ({
                  id: s.id,
                  name: s.session_number ? `#${s.session_number} — ${s.title}` : s.title,
                }))}
                basePath={`/campaigns/${campaignId}/sessions`}
                emptyLabel="Non ancora comparso in nessuna sessione."
              />
            </Card>
          </div>

          {!hasAnyLinks ? (
            <EmptyState
              title="Nessun collegamento ancora"
              description="Fazione, oggetti, quest e sessioni collegate a questo NPC appariranno qui."
            />
          ) : null}

          <NpcNotes campaignId={campaignId} npcId={npcId} notes={notes ?? []} />
        </div>
      </div>
    </div>
  );
}
