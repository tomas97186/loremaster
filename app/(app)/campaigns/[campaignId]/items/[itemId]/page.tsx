import Link from "next/link";
import { MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import type { Item, Quest, Session } from "@/lib/db/types";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import { RelatedSection } from "@/components/entity-related-section";
import { isEmptyHtml } from "@/lib/richtext";

export default async function ItemViewPage({
  params,
}: {
  params: Promise<{ campaignId: string; itemId: string }>;
}) {
  const { campaignId, itemId } = await params;
  const supabase = await createClient();

  const [{ data: item }, { data: questLinks }, { data: itemLinks }] = await Promise.all([
    supabase.from("items").select("*").eq("id", itemId).single<Item>(),
    supabase
      .from("quest_links")
      .select("quest_id")
      .eq("entity_type", "item")
      .eq("entity_id", itemId),
    supabase
      .from("session_links")
      .select("session_id")
      .eq("campaign_id", campaignId)
      .eq("entity_type", "item")
      .eq("entity_id", itemId),
  ]);

  if (!item) notFound();

  const [owner, location] = await Promise.all([
    item.owner_npc_id
      ? supabase
          .from("npcs")
          .select("id, name")
          .eq("id", item.owner_npc_id)
          .maybeSingle<{ id: string; name: string }>()
          .then((r) => r.data)
      : Promise.resolve(null),
    item.location_id
      ? supabase
          .from("locations")
          .select("id, name")
          .eq("id", item.location_id)
          .maybeSingle<{ id: string; name: string }>()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const questIds = (questLinks ?? []).map((l) => l.quest_id as string);
  const { data: questsHere } = questIds.length
    ? await supabase
        .from("quests")
        .select("id, title")
        .in("id", questIds)
        .order("title")
        .returns<Pick<Quest, "id" | "title">[]>()
    : { data: [] as Pick<Quest, "id" | "title">[] };

  const sessionIds = (itemLinks ?? []).map((l) => l.session_id as string);
  const { data: sessionsHere } = sessionIds.length
    ? await supabase
        .from("sessions")
        .select("id, title, session_number")
        .in("id", sessionIds)
        .order("session_number")
        .returns<Pick<Session, "id" | "title" | "session_number">[]>()
    : { data: [] as Pick<Session, "id" | "title" | "session_number">[] };

  const hasAnyLinks =
    !!owner || !!location || (questsHere?.length ?? 0) > 0 || (sessionsHere?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-text">{item.name}</h1>
            {item.item_type ? (
              <Badge tone="gold" className="normal-case">
                {item.item_type}
              </Badge>
            ) : null}
            {item.rarity ? (
              <Badge tone="accent" className="normal-case">
                {item.rarity}
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
        <ButtonLink href={`/campaigns/${campaignId}/items/${itemId}/edit`} variant="secondary" size="sm">
          Modifica
        </ButtonLink>
      </div>

      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url}
          alt={item.name}
          className="mb-4 max-h-80 w-full rounded-xl border border-border object-cover"
        />
      ) : null}

      <Card className="mb-6">
        {isEmptyHtml(item.description) ? (
          <p className="text-sm text-text-muted">Nessuna descrizione ancora.</p>
        ) : (
          <RichTextView html={item.description} campaignId={campaignId} />
        )}
        {item.dm_notes ? (
          <div className="mt-4 border-t border-border pt-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
              Note del DM
            </h2>
            <RichTextView html={item.dm_notes} campaignId={campaignId} />
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <RelatedSection
            title="Proprietario"
            items={owner ? [{ id: owner.id, name: owner.name }] : []}
            basePath={`/campaigns/${campaignId}/npcs`}
            emptyLabel="Nessun proprietario."
          />
        </Card>
        <Card>
          <RelatedSection
            title="Luogo"
            items={location ? [{ id: location.id, name: location.name }] : []}
            basePath={`/campaigns/${campaignId}/locations`}
            emptyLabel="Nessun luogo."
          />
        </Card>
        <Card>
          <RelatedSection
            title="Quest collegate"
            items={(questsHere ?? []).map((q) => ({ id: q.id, name: q.title }))}
            basePath={`/campaigns/${campaignId}/quests`}
            emptyLabel="Nessuna quest collegata a questo oggetto."
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
        <div className="mt-4">
          <EmptyState
            title="Nessun collegamento ancora"
            description="Proprietario, luogo, quest e sessioni collegate a questo oggetto appariranno qui."
          />
        </div>
      ) : null}
    </div>
  );
}
