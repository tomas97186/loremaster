import { importSessions } from "../actions";
import { Field, Textarea } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function ImportSessionsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 font-display text-2xl font-semibold text-text">Importa sessioni</h1>
      <p className="mb-6 text-sm text-text-muted">
        Incolla qui le tue vecchie note con più sessioni: verranno riconosciute cercando
        intestazioni <span className="font-mono">Introduzione N</span> (o{" "}
        <span className="font-mono">Introduzione N-M</span>), con le sezioni{" "}
        <span className="font-mono">Riassunto</span>, <span className="font-mono">Punti Chiave</span> e{" "}
        <span className="font-mono">Punti Esperienza</span> per ciascuna. Il testo prima del
        Riassunto diventa le note di preparazione; il resto il resoconto. Rivedile dopo
        l&apos;importazione: il riconoscimento è automatico e può sbagliare qualche dettaglio.
      </p>

      <form
        action={importSessions.bind(null, campaignId)}
        className="rounded-xl border border-border bg-surface p-6"
      >
        <Field label="Testo con le sessioni" htmlFor="raw_text">
          <Textarea
            id="raw_text"
            name="raw_text"
            className="min-h-96 font-mono text-xs"
            placeholder={"Introduzione 22\n...\nRiassunto\n...\nPunti Chiave\n...\nPunti Esperienza\n...\n\nIntroduzione 23\n..."}
            required
          />
        </Field>

        <label className="mb-4 flex items-center gap-2 text-sm text-text">
          <input type="checkbox" name="polish" className="accent-[var(--color-accent)]" />
          Migliora il testo con l&apos;AI (corregge refusi e grammatica, più lento — una chiamata
          per sessione)
        </label>

        <div className="flex justify-end gap-2">
          <ButtonLink href={`/campaigns/${campaignId}/sessions`} variant="secondary">
            Annulla
          </ButtonLink>
          <SubmitButton pendingText="Importazione…">Importa</SubmitButton>
        </div>
      </form>
    </div>
  );
}
