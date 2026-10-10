import { ImageInput } from "@/components/ui/image-input";
import { Field, Input, Select } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { LOCATION_TYPE_SUGGESTIONS } from "@/lib/constants";
import type { Location } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function LocationForm({
  campaignId,
  action,
  location,
  otherLocations,
  mentionable,
}: {
  campaignId: string;
  action: (formData: FormData) => void;
  location?: Location;
  otherLocations: Pick<Location, "id" | "name">[];
  mentionable: MentionableEntity[];
}) {
  return (
    <form action={action} className="rounded-xl border border-border bg-surface p-6">
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="name">
          <Input id="name" name="name" required defaultValue={location?.name} />
        </Field>
        <Field label="Tipo" htmlFor="type" hint="Es. città, dungeon, taverna...">
          <Input
            id="type"
            name="type"
            list="location-types"
            defaultValue={location?.type ?? ""}
          />
          <datalist id="location-types">
            {LOCATION_TYPE_SUGGESTIONS.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </Field>
      </div>

      <Field label="Luogo padre" htmlFor="parent_id" hint="Per costruire la gerarchia del mondo.">
        <Select id="parent_id" name="parent_id" defaultValue={location?.parent_id ?? ""}>
          <option value="">— Nessuno (livello superiore) —</option>
          {otherLocations
            .filter((l) => l.id !== location?.id)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
        </Select>
      </Field>

      <RichTextField
        label="Descrizione"
        id="description"
        name="description"
        defaultValue={location?.description}
        mentionable={mentionable}
        campaignId={campaignId}
      />

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Immagine (URL)" htmlFor="image_url">
          <ImageInput id="image_url" name="image_url" defaultValue={location?.image_url} />
        </Field>
        <Field label="Mappa (URL)" htmlFor="map_url">
          <ImageInput id="map_url" name="map_url" defaultValue={location?.map_url} />
        </Field>
      </div>

      <RichTextField
        label="Informazioni pubbliche"
        id="public_notes"
        name="public_notes"
        defaultValue={location?.public_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Condivisibili in futuro con i giocatori."
      />
      <RichTextField
        label="Note del DM"
        id="dm_notes"
        name="dm_notes"
        defaultValue={location?.dm_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Segrete, visibili solo a te."
      />

      <div className="mt-6 flex justify-end gap-2">
        <ButtonLink href={`/campaigns/${campaignId}/locations`} variant="secondary">
          Annulla
        </ButtonLink>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
