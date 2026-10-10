import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Location, Faction } from "@/lib/db/types";
import { createQuest } from "../actions";
import { QuestForm } from "../quest-form";

export default async function NewQuestPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const [{ data: locations }, { data: factions }, mentionable] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Location, "id" | "name">[]>(),
    supabase
      .from("factions")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Faction, "id" | "name">[]>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Nuova quest</h1>
      <QuestForm
        campaignId={campaignId}
        action={createQuest.bind(null, campaignId)}
        locations={locations ?? []}
        factions={factions ?? []}
        mentionable={mentionable}
      />
    </div>
  );
}
