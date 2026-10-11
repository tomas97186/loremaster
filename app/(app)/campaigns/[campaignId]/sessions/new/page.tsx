import { createSession } from "../actions";
import { createClient } from "@/lib/db/client";
import { RichTextView } from "@/components/rich-text/rich-text-view";
import { isEmptyHtml } from "@/lib/richtext";
import { Field, Input } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  const supabase = await createClient();
  const { data: recent } = await supabase
    .from("sessions")
    .select("title, session_number, summary")
    .eq("campaign_id", campaignId)
    .order("session_number", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(10);
  const nextNumber = Math.max(0, ...(recent ?? []).map((s) => s.session_number ?? 0)) + 1;
  const lastWithSummary = (recent ?? []).find((s) => !isEmptyHtml(s.summary));

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
            <Input
              id="session_number"
              name="session_number"
              type="number"
              min={1}
              defaultValue={nextNumber}
            />
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

      {lastWithSummary ? (
        <details open className="mt-6 rounded-xl border border-border bg-surface p-5">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Resoconto dell&apos;ultima sessione
            {lastWithSummary.session_number ? ` · #${lastWithSummary.session_number}` : ""} ·{" "}
            {lastWithSummary.title}
          </summary>
          <div className="mt-3">
            <RichTextView html={lastWithSummary.summary} campaignId={campaignId} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
