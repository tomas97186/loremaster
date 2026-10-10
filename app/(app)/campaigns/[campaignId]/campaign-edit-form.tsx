import { updateCampaign, deleteCampaign } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import type { Campaign } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function CampaignEditForm({
  campaign,
  mentionable,
}: {
  campaign: Campaign;
  mentionable: MentionableEntity[];
}) {
  const update = updateCampaign.bind(null, campaign.id);
  const remove = deleteCampaign.bind(null, campaign.id);

  return (
    <div className="space-y-8">
      <form action={update}>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="name">
            <Input id="name" name="name" defaultValue={campaign.name} required />
          </Field>
          <Field label="Sistema / regole" htmlFor="system">
            <Input id="system" name="system" defaultValue={campaign.system ?? ""} />
          </Field>
          <Field label="Ambientazione" htmlFor="setting">
            <Input id="setting" name="setting" defaultValue={campaign.setting ?? ""} />
          </Field>
          <Field label="Livello / periodo" htmlFor="level_or_period">
            <Input
              id="level_or_period"
              name="level_or_period"
              defaultValue={campaign.level_or_period ?? ""}
            />
          </Field>
        </div>
        <RichTextField
          label="Descrizione"
          id="description"
          name="description"
          defaultValue={campaign.description}
          mentionable={mentionable}
          campaignId={campaign.id}
        />
        <RichTextField
          label="Note private del DM"
          id="dm_notes"
          name="dm_notes"
          defaultValue={campaign.dm_notes}
          mentionable={mentionable}
          campaignId={campaign.id}
          hint="Visibili solo a te."
        />
        <SubmitButton>Salva modifiche</SubmitButton>
      </form>

      <div className="rounded-lg border border-danger/30 bg-danger/5 p-4">
        <p className="mb-3 text-sm text-text">
          Eliminare questa campagna cancella definitivamente tutti i luoghi, NPC,
          quest, sessioni e note collegati.
        </p>
        <form action={remove}>
          <ConfirmSubmitButton
            confirmMessage={`Eliminare "${campaign.name}" e tutti i suoi dati? L'azione non è reversibile.`}
          >
            Elimina campagna
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
