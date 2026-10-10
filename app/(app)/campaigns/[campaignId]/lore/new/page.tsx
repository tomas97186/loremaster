import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import { createLoreNote } from "../actions";
import { LoreForm } from "../lore-form";

export default async function NewLoreNotePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const mentionable = await getMentionableEntities(supabase, campaignId);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Nuova nota</h1>
      <LoreForm
        campaignId={campaignId}
        action={createLoreNote.bind(null, campaignId)}
        mentionable={mentionable}
      />
    </div>
  );
}
