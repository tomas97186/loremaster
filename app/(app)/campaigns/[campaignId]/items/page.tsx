import { createClient } from "@/lib/db/client";
import type { Item } from "@/lib/db/types";
import { EntityListPage } from "@/components/entity-list";
import { Badge } from "@/components/ui/card";
import { stripHtml } from "@/lib/richtext";

export default async function ItemsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("name")
    .returns<Item[]>();

  return (
    <EntityListPage
      title="Oggetti"
      newHref={`/campaigns/${campaignId}/items/new`}
      newLabel="Nuovo oggetto"
      items={items ?? []}
      basePath={(i) => `/campaigns/${campaignId}/items/${i.id}`}
      emptyTitle="Nessun oggetto ancora"
      emptyDescription="Armi, artefatti, pozioni e altri oggetti di rilievo."
      renderCard={(item) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-text">{item.name}</h2>
            {item.rarity ? <Badge tone="gold">{item.rarity}</Badge> : null}
          </div>
          {item.item_type ? <p className="mt-1 text-xs text-text-muted">{item.item_type}</p> : null}
          {stripHtml(item.description) ? (
            <p className="mt-2 line-clamp-2 text-sm text-text-muted">
              {stripHtml(item.description)}
            </p>
          ) : null}
        </>
      )}
    />
  );
}
