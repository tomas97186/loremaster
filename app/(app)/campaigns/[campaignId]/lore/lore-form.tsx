import { Field, Input } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { LoreNote } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function LoreForm({
  campaignId,
  action,
  note,
  mentionable,
}: {
  campaignId: string;
  action: (formData: FormData) => void;
  note?: LoreNote;
  mentionable: MentionableEntity[];
}) {
  return (
    <form action={action} className="rounded-xl border border-border bg-surface p-6">
      <Field label="Titolo" htmlFor="title">
        <Input id="title" name="title" required defaultValue={note?.title} />
      </Field>
      <RichTextField
        label="Contenuto"
        id="content"
        name="content"
        defaultValue={note?.content}
        mentionable={mentionable}
        campaignId={campaignId}
      />
      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={note?.is_public ?? false}
          className="accent-[var(--color-accent)]"
        />
        Condivisibile con i giocatori
      </label>

      <div className="mt-6 flex justify-end gap-2">
        <ButtonLink href={`/campaigns/${campaignId}/lore`} variant="secondary">
          Annulla
        </ButtonLink>
        <SubmitButton>Salva</SubmitButton>
      </div>
    </form>
  );
}
