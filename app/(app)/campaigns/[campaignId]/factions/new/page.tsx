import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import { createFaction } from "../actions";
import { FactionForm } from "../faction-form";

export default async function NewFactionPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const mentionable = await getMentionableEntities(supabase, campaignId);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Nuova fazione</h1>
      <FactionForm
        campaignId={campaignId}
        action={createFaction.bind(null, campaignId)}
        mentionable={mentionable}
      />
    </div>
  );
}
