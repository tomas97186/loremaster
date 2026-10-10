import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import type { Location, Npc, Quest, Item, Session } from "@/lib/db/types";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/card";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import { RelatedSection } from "@/components/entity-related-section";
import { QUEST_STATUS_LABELS } from "@/lib/constants";
import { isEmptyHtml } from "@/lib/richtext";

export default async function LocationViewPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string }>;
}) {
  const { campaignId, locationId } = await params;
  const supabase = await createClient();

  const [
    { data: location },
    { data: childLocations },
    { data: npcsHere },
    { data: questsHere },
    { data: itemsHere },
    { data: locationLinks },
  ] = await Promise.all([
    supabase.from("locations").select("*").eq("id", locationId).single<Location>(),
    supabase
      .from("locations")
      .select("id, name, type")
      .eq("parent_id", locationId)
      .order("name")
      .returns<Pick<Location, "id" | "name" | "type">[]>(),
    supabase
      .from("npcs")
      .select("id, name, role")
      .eq("location_id", locationId)
      .order("name")
      .returns<Pick<Npc, "id" | "name" | "role">[]>(),
    supabase
      .from("quests")
      .select("id, title, status")
      .eq("location_id", locationId)
      .order("title")
      .returns<Pick<Quest, "id" | "title" | "status">[]>(),
    supabase
      .from("items")
      .select("id, name, item_type")
      .eq("location_id", locationId)
      .order("name")
      .returns<Pick<Item, "id" | "name" | "item_type">[]>(),
    supabase
      .from("session_links")
      .select("session_id")
      .eq("campaign_id", campaignId)
      .eq("entity_type", "location")
      .eq("entity_id", locationId),
  ]);

  if (!location) notFound();

  const parentLocation = location.parent_id
    ? (
        await supabase
          .from("locations")
          .select("id, name")
          .eq("id", location.parent_id)
          .single<Pick<Location, "id" | "name">>()
      ).data
    : null;

  const sessionIds = (locationLinks ?? []).map((link) => link.session_id);
  const { data: sessionsHere } = sessionIds.length
    ? await supabase
        .from("sessions")
        .select("id, title, session_number")
        .in("id", sessionIds)
        .order("session_number")
        .returns<Pick<Session, "id" | "title" | "session_number">[]>()
    : { data: [] as Pick<Session, "id" | "title" | "session_number">[] };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {parentLocation ? (
            <Link
              href={`/campaigns/${campaignId}/locations/${parentLocation.id}`}
              className="mb-1 inline-block text-sm text-text-muted hover:text-text"
            >
              ‹ {parentLocation.name}
            </Link>
          ) : null}
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-text">{location.name}</h1>
            {location.type ? (
              <Badge tone="gold" className="normal-case">
                {location.type}
              </Badge>
            ) : null}
          </div>
        </div>
        <ButtonLink href={`/campaigns/${campaignId}/locations/${locationId}/edit`} variant="secondary" size="sm">
          Modifica
        </ButtonLink>
      </div>

      {location.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={location.image_url}
          alt={location.name}
          className="mb-4 max-h-80 w-full rounded-xl border border-border object-cover"
        />
      ) : null}
      {location.map_url ? (
        <a
          href={location.map_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-block text-sm text-accent underline"
        >
          Apri mappa
        </a>
      ) : null}

      <Card className="mb-6">
        {isEmptyHtml(location.description) ? (
          <p className="text-sm text-text-muted">Nessuna descrizione ancora.</p>
        ) : (
          <RichTextView html={location.description} campaignId={campaignId} />
        )}
        {location.public_notes ? (
          <div className="mt-4 border-t border-border pt-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
              Informazioni pubbliche
            </h2>
            <RichTextView html={location.public_notes} campaignId={campaignId} />
          </div>
        ) : null}
        {location.dm_notes ? (
          <div className="mt-4 border-t border-border pt-4">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
              Note del DM
            </h2>
            <RichTextView html={location.dm_notes} campaignId={campaignId} />
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <RelatedSection
            title="Luoghi figli"
            items={(childLocations ?? []).map((l) => ({ id: l.id, name: l.name, sub: l.type }))}
            basePath={`/campaigns/${campaignId}/locations`}
            emptyLabel="Nessun luogo figlio."
          />
        </Card>
        <Card>
          <RelatedSection
            title="NPC qui presenti"
            items={(npcsHere ?? []).map((n) => ({ id: n.id, name: n.name, sub: n.role }))}
            basePath={`/campaigns/${campaignId}/npcs`}
            emptyLabel="Nessun NPC qui."
          />
        </Card>
        <Card>
          <RelatedSection
            title="Quest legate"
            items={(questsHere ?? []).map((q) => ({
              id: q.id,
              name: q.title,
              sub: QUEST_STATUS_LABELS[q.status],
            }))}
            basePath={`/campaigns/${campaignId}/quests`}
            emptyLabel="Nessuna quest legata a questo luogo."
          />
        </Card>
        <Card>
          <RelatedSection
            title="Oggetti qui presenti"
            items={(itemsHere ?? []).map((i) => ({ id: i.id, name: i.name, sub: i.item_type }))}
            basePath={`/campaigns/${campaignId}/items`}
            emptyLabel="Nessun oggetto qui."
          />
        </Card>
      </div>

      <Card className="mt-4">
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

      {!childLocations?.length &&
      !npcsHere?.length &&
      !questsHere?.length &&
      !itemsHere?.length &&
      !sessionsHere?.length ? (
        <div className="mt-4">
          <EmptyState
            title="Nessun collegamento ancora"
            description="NPC, quest e oggetti collegati a questo luogo appariranno qui."
          />
        </div>
      ) : null}
    </div>
  );
}
