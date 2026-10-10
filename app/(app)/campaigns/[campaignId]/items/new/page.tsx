import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Location, Npc } from "@/lib/db/types";
import { createItem } from "../actions";
import { ItemForm } from "../item-form";

export default async function NewItemPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const [{ data: locations }, { data: npcs }, mentionable] = await Promise.all([
    supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Location, "id" | "name">[]>(),
    supabase
      .from("npcs")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name")
      .returns<Pick<Npc, "id" | "name">[]>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Nuovo oggetto</h1>
      <ItemForm
        campaignId={campaignId}
        action={createItem.bind(null, campaignId)}
        locations={locations ?? []}
        npcs={npcs ?? []}
        mentionable={mentionable}
      />
    </div>
  );
}
