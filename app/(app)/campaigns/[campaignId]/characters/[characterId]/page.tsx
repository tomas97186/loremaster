import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Character } from "@/lib/db/types";
import { updateCharacter, deleteCharacter } from "../actions";
import { CharacterForm } from "../character-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export default async function EditCharacterPage({
  params,
}: {
  params: Promise<{ campaignId: string; characterId: string }>;
}) {
  const { campaignId, characterId } = await params;
  const supabase = await createClient();
  const [{ data: character }, mentionable] = await Promise.all([
    supabase.from("characters").select("*").eq("id", characterId).single<Character>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  if (!character) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">{character.name}</h1>
      <CharacterForm
        campaignId={campaignId}
        action={updateCharacter.bind(null, campaignId, characterId)}
        character={character}
        mentionable={mentionable}
      />
      <form
        action={deleteCharacter.bind(null, campaignId, characterId)}
        className="mt-4 flex justify-end"
      >
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare "${character.name}"? L'azione non è reversibile.`}
        >
          Elimina personaggio
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
