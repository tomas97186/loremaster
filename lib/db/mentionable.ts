import type { createClient } from "@/lib/db/client";
import type { MentionableEntity, MentionableType } from "@/lib/richtext";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Tutte le entità "citabili" di una campagna, per il popup di suggerimento
 * dell'editor rich text (digitando "@"). Stesso set di tipi già usato da
 * `SessionLinkEntityType` in lib/db/types.ts.
 */
export async function getMentionableEntities(
  supabase: SupabaseServerClient,
  campaignId: string,
): Promise<MentionableEntity[]> {
  const [npcs, locations, factions, quests, characters, items] = await Promise.all([
    supabase.from("npcs").select("id, name").eq("campaign_id", campaignId),
    supabase.from("locations").select("id, name").eq("campaign_id", campaignId),
    supabase.from("factions").select("id, name").eq("campaign_id", campaignId),
    supabase.from("quests").select("id, title").eq("campaign_id", campaignId),
    supabase.from("characters").select("id, name").eq("campaign_id", campaignId),
    supabase.from("items").select("id, name").eq("campaign_id", campaignId),
  ]);

  const toEntities = (
    rows: { id: string; name?: string; title?: string }[] | null,
    type: MentionableType,
  ): MentionableEntity[] =>
    (rows ?? []).map((row) => ({
      id: row.id,
      name: (row.name ?? row.title ?? "") as string,
      type,
    }));

  const entities: MentionableEntity[] = [
    ...toEntities(npcs.data, "npc"),
    ...toEntities(locations.data, "location"),
    ...toEntities(factions.data, "faction"),
    ...toEntities(quests.data as { id: string; title?: string }[] | null, "quest"),
    ...toEntities(characters.data, "character"),
    ...toEntities(items.data, "item"),
  ];

  return entities.sort((a, b) => a.name.localeCompare(b.name, "it"));
}
