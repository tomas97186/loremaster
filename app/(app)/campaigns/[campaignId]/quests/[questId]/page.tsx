import Link from "next/link";
import { MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Quest, Npc, Character, Faction, Item, Session, Encounter } from "@/lib/db/types";
import { getQuestLinkedEntities } from "../actions";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import { RelatedSection } from "@/components/entity-related-section";
import { EncounterEditor } from "../../encounter-editor";
import { QUEST_STATUS_LABELS, QUEST_STATUS_TONES } from "@/lib/constants";
import { isEmptyHtml } from "@/lib/richtext";

export default async function QuestViewPage({
  params,
}: {
  params: Promise<{ campaignId: string; questId: string }>;
}) {
  const { campaignId, questId } = await params;
  const supabase = await createClient();

  const [{ data: quest }, linked, { data: sessionLinks }, { data: encounters }, mentionable] =
    await Promise.all([
      supabase.from("quests").select("*").eq("id", questId).single<Quest>(),
      getQuestLinkedEntities(questId),
      supabase
        .from("session_links")
        .select("session_id")
        .eq("campaign_id", campaignId)
        .eq("entity_type", "quest")
        .eq("entity_id", questId),
      supabase
        .from("encounters")
        .select("*")
        .eq("quest_id", questId)
        .order("position")
        .returns<Encounter[]>(),
      getMentionableEntities(supabase, campaignId),
    ]);

  if (!quest) notFound();

  const [{ data: location }, { data: npcs }, { data: characters }, { data: factions }, { data: items }] =
    await Promise.all([
      quest.location_id
        ? supabase
            .from("locations")
            .select("id, name")
            .eq("id", quest.location_id)
            .maybeSingle<{ id: string; name: string }>()
        : Promise.resolve({ data: null }),
      linked.npc.length
        ? supabase
            .from("npcs")
            .select("id, name, role")
            .in("id", linked.npc)
            .order("name")
            .returns<Pick<Npc, "id" | "name" | "role">[]>()
        : Promise.resolve({ data: [] as Pick<Npc, "id" | "name" | "role">[] }),
      linked.character.length
        ? supabase
            .from("characters")
            .select("id, name")
            .in("id", linked.character)
            .order("name")
            .returns<Pick<Character, "id" | "name">[]>()
        : Promise.resolve({ data: [] as Pick<Character, "id" | "name">[] }),
      linked.faction.length
        ? supabase
            .from("factions")
            .select("id, name")
            .in("id", linked.faction)
            .order("name")
            .returns<Pick<Faction, "id" | "name">[]>()
        : Promise.resolve({ data: [] as Pick<Faction, "id" | "name">[] }),
      linked.item.length
        ? supabase
            .from("items")
            .select("id, name, item_type")
            .in("id", linked.item)
            .order("name")
            .returns<Pick<Item, "id" | "name" | "item_type">[]>()
        : Promise.resolve({ data: [] as Pick<Item, "id" | "name" | "item_type">[] }),
    ]);

  const sessionIds = (sessionLinks ?? []).map((l) => l.session_id as string);
  const { data: sessionsHere } = sessionIds.length
    ? await supabase
        .from("sessions")
        .select("id, title, session_number")
        .in("id", sessionIds)
        .order("session_number")
        .returns<Pick<Session, "id" | "title" | "session_number">[]>()
    : { data: [] as Pick<Session, "id" | "title" | "session_number">[] };

  const hasAnyLinks =
    !!location ||
    (npcs?.length ?? 0) > 0 ||
    (characters?.length ?? 0) > 0 ||
    (factions?.length ?? 0) > 0 ||
    (items?.length ?? 0) > 0 ||
    (sessionsHere?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-text">{quest.title}</h1>
            <Badge tone={QUEST_STATUS_TONES[quest.status]}>{QUEST_STATUS_LABELS[quest.status]}</Badge>
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
        <ButtonLink href={`/campaigns/${campaignId}/quests/${questId}/edit`} variant="secondary" size="sm">
          Modifica
        </ButtonLink>
      </div>

      <Card className="mb-6">
        {isEmptyHtml(quest.description) ? (
          <p className="text-sm text-text-muted">Nessuna descrizione ancora.</p>
        ) : (
          <RichTextView html={quest.description} campaignId={campaignId} />
        )}
        {quest.public_notes ? (
          <div className="mt-4 border-t border-border pt-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
              Informazioni pubbliche
            </h2>
            <RichTextView html={quest.public_notes} campaignId={campaignId} />
          </div>
        ) : null}
        {quest.dm_notes ? (
          <div className="mt-4 border-t border-border pt-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
              Note del DM
            </h2>
            <RichTextView html={quest.dm_notes} campaignId={campaignId} />
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <RelatedSection
            title="NPC coinvolti"
            items={(npcs ?? []).map((n) => ({ id: n.id, name: n.name, sub: n.role }))}
            basePath={`/campaigns/${campaignId}/npcs`}
            emptyLabel="Nessun NPC coinvolto."
          />
        </Card>
        <Card>
          <RelatedSection
            title="Personaggi coinvolti"
            items={(characters ?? []).map((c) => ({ id: c.id, name: c.name }))}
            basePath={`/campaigns/${campaignId}/characters`}
            emptyLabel="Nessun personaggio coinvolto."
          />
        </Card>
        <Card>
          <RelatedSection
            title="Fazioni coinvolte"
            items={(factions ?? []).map((f) => ({ id: f.id, name: f.name }))}
            basePath={`/campaigns/${campaignId}/factions`}
            emptyLabel="Nessuna fazione coinvolta."
          />
        </Card>
        <Card>
          <RelatedSection
            title="Oggetti collegati"
            items={(items ?? []).map((i) => ({ id: i.id, name: i.name, sub: i.item_type }))}
            basePath={`/campaigns/${campaignId}/items`}
            emptyLabel="Nessun oggetto collegato."
          />
        </Card>
        <Card className="sm:col-span-2">
          <RelatedSection
            title="Sessioni in cui è comparsa"
            items={(sessionsHere ?? []).map((s) => ({
              id: s.id,
              name: s.session_number ? `#${s.session_number} — ${s.title}` : s.title,
            }))}
            basePath={`/campaigns/${campaignId}/sessions`}
            emptyLabel="Non ancora comparsa in nessuna sessione."
          />
        </Card>
      </div>

      {!hasAnyLinks ? (
        <div className="mt-4">
          <EmptyState
            title="Nessun collegamento ancora"
            description="Luogo, NPC, personaggi, fazioni, oggetti e sessioni collegate a questa quest appariranno qui."
          />
        </div>
      ) : null}

      <div className="mt-6">
        <EncounterEditor
          campaignId={campaignId}
          scope={{ questId }}
          encounters={encounters ?? []}
          mentionable={mentionable}
        />
      </div>
    </div>
  );
}
