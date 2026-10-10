import { createClient } from "@/lib/db/client";
import type { Quest } from "@/lib/db/types";
import { EntityListPage } from "@/components/entity-list";
import { Badge } from "@/components/ui/card";
import { QUEST_STATUS_LABELS, QUEST_STATUS_TONES } from "@/lib/constants";
import { stripHtml } from "@/lib/richtext";

export default async function QuestsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: quests } = await supabase
    .from("quests")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("updated_at", { ascending: false })
    .returns<Quest[]>();

  return (
    <EntityListPage
      title="Quest"
      newHref={`/campaigns/${campaignId}/quests/new`}
      newLabel="Nuova quest"
      items={quests ?? []}
      basePath={(q) => `/campaigns/${campaignId}/quests/${q.id}`}
      emptyTitle="Nessuna quest ancora"
      emptyDescription="Missioni principali, secondarie e idee non ancora sviluppate."
      renderCard={(quest) => (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-text">{quest.title}</h2>
            <Badge tone={QUEST_STATUS_TONES[quest.status]}>
              {QUEST_STATUS_LABELS[quest.status]}
            </Badge>
          </div>
          {stripHtml(quest.description) ? (
            <p className="mt-2 line-clamp-3 text-sm text-text-muted">
              {stripHtml(quest.description)}
            </p>
          ) : null}
        </>
      )}
    />
  );
}
