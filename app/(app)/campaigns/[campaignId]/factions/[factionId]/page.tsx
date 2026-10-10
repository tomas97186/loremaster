import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Faction } from "@/lib/db/types";
import { updateFaction, deleteFaction } from "../actions";
import { FactionForm } from "../faction-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export default async function EditFactionPage({
  params,
}: {
  params: Promise<{ campaignId: string; factionId: string }>;
}) {
  const { campaignId, factionId } = await params;
  const supabase = await createClient();
  const [{ data: faction }, mentionable] = await Promise.all([
    supabase.from("factions").select("*").eq("id", factionId).single<Faction>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  if (!faction) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">{faction.name}</h1>
      <FactionForm
        campaignId={campaignId}
        action={updateFaction.bind(null, campaignId, factionId)}
        faction={faction}
        mentionable={mentionable}
      />
      <form action={deleteFaction.bind(null, campaignId, factionId)} className="mt-4 flex justify-end">
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare "${faction.name}"? L'azione non è reversibile.`}
        >
          Elimina fazione
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
