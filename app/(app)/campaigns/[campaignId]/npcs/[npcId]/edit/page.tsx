import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Npc, Location, Faction } from "@/lib/db/types";
import { updateNpc, deleteNpc } from "../../actions";
import { NpcForm } from "../../npc-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export default async function EditNpcPage({
  params,
}: {
  params: Promise<{ campaignId: string; npcId: string }>;
}) {
  const { campaignId, npcId } = await params;
  const supabase = await createClient();

  const [{ data: npc }, { data: locations }, { data: factions }, mentionable] = await Promise.all([
    supabase.from("npcs").select("*").eq("id", npcId).single<Npc>(),
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

  if (!npc) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">{npc.name}</h1>
      <NpcForm
        campaignId={campaignId}
        action={updateNpc.bind(null, campaignId, npcId)}
        npc={npc}
        locations={locations ?? []}
        factions={factions ?? []}
        mentionable={mentionable}
      />
      <form action={deleteNpc.bind(null, campaignId, npcId)} className="mt-4 flex justify-end">
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare "${npc.name}"? L'azione non è reversibile.`}
        >
          Elimina NPC
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
