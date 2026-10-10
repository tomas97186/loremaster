import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import { createCharacter } from "../actions";
import { CharacterForm } from "../character-form";

export default async function NewCharacterPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const mentionable = await getMentionableEntities(supabase, campaignId);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Nuovo personaggio</h1>
      <CharacterForm
        campaignId={campaignId}
        action={createCharacter.bind(null, campaignId)}
        mentionable={mentionable}
      />
    </div>
  );
}
