import { createClient } from "@/lib/db/client";
import type { Character } from "@/lib/db/types";
import { EntityListPage } from "@/components/entity-list";

export default async function CharactersPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const supabase = await createClient();
  const { data: characters } = await supabase
    .from("characters")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("name")
    .returns<Character[]>();

  return (
    <EntityListPage
      title="Personaggi"
      newHref={`/campaigns/${campaignId}/characters/new`}
      newLabel="Nuovo personaggio"
      items={characters ?? []}
      basePath={(c) => `/campaigns/${campaignId}/characters/${c.id}`}
      emptyTitle="Nessun personaggio ancora"
      emptyDescription="I personaggi giocanti del tuo party."
      renderCard={(character) => (
        <>
          <h2 className="font-display text-lg font-semibold text-text">
            {character.name}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {[character.race, character.class, character.level ? `liv. ${character.level}` : null]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
          {character.player_name ? (
            <p className="mt-1 text-xs text-text-muted">Giocatore: {character.player_name}</p>
          ) : null}
        </>
      )}
    />
  );
}
