import { ImageInput } from "@/components/ui/image-input";
import { Field, Input } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Character } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function CharacterForm({
  campaignId,
  action,
  character,
  mentionable,
}: {
  campaignId: string;
  action: (formData: FormData) => void;
  character?: Character;
  mentionable: MentionableEntity[];
}) {
  return (
    <form action={action} className="rounded-xl border border-border bg-surface p-6">
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Nome personaggio" htmlFor="name">
          <Input id="name" name="name" required defaultValue={character?.name} />
        </Field>
        <Field label="Giocatore" htmlFor="player_name">
          <Input id="player_name" name="player_name" defaultValue={character?.player_name ?? ""} />
        </Field>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-3">
        <Field label="Razza" htmlFor="race">
          <Input id="race" name="race" defaultValue={character?.race ?? ""} />
        </Field>
        <Field label="Classe" htmlFor="class">
          <Input id="class" name="class" defaultValue={character?.class ?? ""} />
        </Field>
        <Field label="Livello" htmlFor="level">
          <Input id="level" name="level" type="number" min={1} defaultValue={character?.level ?? ""} />
        </Field>
      </div>
      <RichTextField
        label="Descrizione"
        id="description"
        name="description"
        defaultValue={character?.description}
        mentionable={mentionable}
        campaignId={campaignId}
      />
      <Field label="Immagine (URL)" htmlFor="image_url">
        <ImageInput id="image_url" name="image_url" defaultValue={character?.image_url} />
      </Field>
      <RichTextField
        label="Note del DM"
        id="dm_notes"
        name="dm_notes"
        defaultValue={character?.dm_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Segrete, visibili solo a te."
      />

      <div className="mt-6 flex justify-end gap-2">
        <ButtonLink href={`/campaigns/${campaignId}/characters`} variant="secondary">
          Annulla
        </ButtonLink>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
