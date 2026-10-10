import { ImageInput } from "@/components/ui/image-input";
import { Field, Input } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Faction } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function FactionForm({
  campaignId,
  action,
  faction,
  mentionable,
}: {
  campaignId: string;
  action: (formData: FormData) => void;
  faction?: Faction;
  mentionable: MentionableEntity[];
}) {
  return (
    <form action={action} className="rounded-xl border border-border bg-surface p-6">
      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" required defaultValue={faction?.name} />
      </Field>
      <RichTextField
        label="Descrizione"
        id="description"
        name="description"
        defaultValue={faction?.description}
        mentionable={mentionable}
        campaignId={campaignId}
      />
      <RichTextField
        label="Obiettivi"
        id="goals"
        name="goals"
        defaultValue={faction?.goals}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Cosa vuole ottenere questa fazione?"
      />
      <Field label="Immagine (URL)" htmlFor="image_url">
        <ImageInput id="image_url" name="image_url" defaultValue={faction?.image_url} />
      </Field>
      <RichTextField
        label="Informazioni pubbliche"
        id="public_notes"
        name="public_notes"
        defaultValue={faction?.public_notes}
        mentionable={mentionable}
        campaignId={campaignId}
      />
      <RichTextField
        label="Note del DM"
        id="dm_notes"
        name="dm_notes"
        defaultValue={faction?.dm_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Segrete, visibili solo a te."
      />

      <div className="mt-6 flex justify-end gap-2">
        <ButtonLink href={`/campaigns/${campaignId}/factions`} variant="secondary">
          Annulla
        </ButtonLink>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
