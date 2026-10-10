import { createSession } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">Nuova sessione</h1>
      <form
        action={createSession.bind(null, campaignId)}
        className="rounded-xl border border-border bg-surface p-6"
      >
        <Field label="Titolo" htmlFor="title">
          <Input id="title" name="title" required placeholder="La caduta di Aldenmoor" />
        </Field>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Numero sessione" htmlFor="session_number">
            <Input id="session_number" name="session_number" type="number" min={1} />
          </Field>
          <Field label="Data e ora" htmlFor="scheduled_at">
            <Input id="scheduled_at" name="scheduled_at" type="datetime-local" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <ButtonLink href={`/campaigns/${campaignId}/sessions`} variant="secondary">
            Annulla
          </ButtonLink>
          <SubmitButton pendingText="Creazione…">Crea sessione</SubmitButton>
        </div>
      </form>
    </div>
  );
}
