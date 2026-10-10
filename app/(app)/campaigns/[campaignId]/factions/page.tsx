import { createClient } from "@/lib/db/client";
import type { Faction } from "@/lib/db/types";
import { EntityListPage } from "@/components/entity-list";
import { stripHtml } from "@/lib/richtext";

export default async function FactionsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: factions } = await supabase
    .from("factions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("name")
    .returns<Faction[]>();

  return (
    <EntityListPage
      title="Fazioni"
      newHref={`/campaigns/${campaignId}/factions/new`}
      newLabel="Nuova fazione"
      items={factions ?? []}
      basePath={(f) => `/campaigns/${campaignId}/factions/${f.id}`}
      emptyTitle="Nessuna fazione ancora"
      emptyDescription="Gilde, culti, casate nobiliari, ordini cavallereschi..."
      renderCard={(faction) => (
        <>
          <h2 className="font-display text-lg font-semibold text-text">
            {faction.name}
          </h2>
          {stripHtml(faction.description) ? (
            <p className="mt-2 line-clamp-3 text-sm text-text-muted">
              {stripHtml(faction.description)}
            </p>
          ) : null}
        </>
      )}
    />
  );
}
