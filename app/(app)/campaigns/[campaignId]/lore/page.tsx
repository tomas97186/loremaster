import { createClient } from "@/lib/db/client";
import type { LoreNote } from "@/lib/db/types";
import { EntityListPage } from "@/components/entity-list";
import { Badge } from "@/components/ui/card";

export default async function LorePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: notes } = await supabase
    .from("lore_notes")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false })
    .returns<LoreNote[]>();

  return (
    <EntityListPage
      title="Lore / Note"
      newHref={`/campaigns/${campaignId}/lore/new`}
      newLabel="Nuova nota"
      items={notes ?? []}
      basePath={(n) => `/campaigns/${campaignId}/lore/${n.id}`}
      emptyTitle="Nessuna nota ancora"
      emptyDescription="Storia del mondo, regole homebrew, appunti sparsi."
      renderCard={(note) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-text">{note.title}</h2>
            {note.is_public ? <Badge tone="success">Pubblica</Badge> : null}
          </div>
          {note.content ? (
            <p className="mt-2 line-clamp-3 text-sm text-text-muted">
              {note.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}
            </p>
          ) : null}
        </>
      )}
    />
  );
}
