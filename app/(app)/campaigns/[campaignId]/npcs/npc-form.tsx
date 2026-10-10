import { ImageInput } from "@/components/ui/image-input";
import { Field, Input, Select } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Npc, Location, Faction } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function NpcForm({
  campaignId,
  action,
  npc,
  locations,
  factions,
  mentionable,
}: {
  campaignId: string;
  action: (formData: FormData) => void;
  npc?: Npc;
  locations: Pick<Location, "id" | "name">[];
  factions: Pick<Faction, "id" | "name">[];
  mentionable: MentionableEntity[];
}) {
  return (
    <form action={action} className="rounded-xl border border-border bg-surface p-6">
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="name">
          <Input id="name" name="name" required defaultValue={npc?.name} />
        </Field>
        <Field label="Ruolo" htmlFor="role" hint="Es. fabbro, capitano della guardia...">
          <Input id="role" name="role" defaultValue={npc?.role ?? ""} />
        </Field>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Luogo" htmlFor="location_id">
          <Select id="location_id" name="location_id" defaultValue={npc?.location_id ?? ""}>
            <option value="">— Nessuno —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fazione" htmlFor="faction_id">
          <Select id="faction_id" name="faction_id" defaultValue={npc?.faction_id ?? ""}>
            <option value="">— Nessuna —</option>
            {factions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <RichTextField
        label="Descrizione"
        id="description"
        name="description"
        defaultValue={npc?.description}
        mentionable={mentionable}
        campaignId={campaignId}
      />
      <Field label="Immagine (URL)" htmlFor="image_url">
        <ImageInput id="image_url" name="image_url" defaultValue={npc?.image_url} />
      </Field>
      <RichTextField
        label="Informazioni pubbliche"
        id="public_notes"
        name="public_notes"
        defaultValue={npc?.public_notes}
        mentionable={mentionable}
        campaignId={campaignId}
      />
      <RichTextField
        label="Note del DM"
        id="dm_notes"
        name="dm_notes"
        defaultValue={npc?.dm_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Segrete, visibili solo a te."
      />

      <div className="mt-6 flex justify-end gap-2">
        <ButtonLink href={`/campaigns/${campaignId}/npcs`} variant="secondary">
          Annulla
        </ButtonLink>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
