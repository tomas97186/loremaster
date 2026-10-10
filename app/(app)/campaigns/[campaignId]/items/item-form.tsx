import { ImageInput } from "@/components/ui/image-input";
import { Field, Input, Select } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Item, Location, Npc } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function ItemForm({
  campaignId,
  action,
  item,
  locations,
  npcs,
  mentionable,
}: {
  campaignId: string;
  action: (formData: FormData) => void;
  item?: Item;
  locations: Pick<Location, "id" | "name">[];
  npcs: Pick<Npc, "id" | "name">[];
  mentionable: MentionableEntity[];
}) {
  return (
    <form action={action} className="rounded-xl border border-border bg-surface p-6">
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="name">
          <Input id="name" name="name" required defaultValue={item?.name} />
        </Field>
        <Field label="Tipo" htmlFor="item_type" hint="Es. arma, pozione, artefatto...">
          <Input id="item_type" name="item_type" defaultValue={item?.item_type ?? ""} />
        </Field>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-3">
        <Field label="Rarità" htmlFor="rarity">
          <Input id="rarity" name="rarity" defaultValue={item?.rarity ?? ""} />
        </Field>
        <Field label="Proprietario (NPC)" htmlFor="owner_npc_id">
          <Select id="owner_npc_id" name="owner_npc_id" defaultValue={item?.owner_npc_id ?? ""}>
            <option value="">— Nessuno —</option>
            {npcs.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Luogo" htmlFor="location_id">
          <Select id="location_id" name="location_id" defaultValue={item?.location_id ?? ""}>
            <option value="">— Nessuno —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <RichTextField
        label="Descrizione"
        id="description"
        name="description"
        defaultValue={item?.description}
        mentionable={mentionable}
        campaignId={campaignId}
      />
      <Field label="Immagine (URL)" htmlFor="image_url">
        <ImageInput id="image_url" name="image_url" defaultValue={item?.image_url} />
      </Field>
      <RichTextField
        label="Note del DM"
        id="dm_notes"
        name="dm_notes"
        defaultValue={item?.dm_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Segrete, visibili solo a te."
      />

      <div className="mt-6 flex justify-end gap-2">
        <ButtonLink href={`/campaigns/${campaignId}/items`} variant="secondary">
          Annulla
        </ButtonLink>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
