import { createCampaign } from "../actions";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Field, Input, Textarea } from "@/components/ui/field";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 font-display text-2xl font-semibold text-text">
        Nuova campagna
      </h1>
      <p className="mb-6 text-sm text-text-muted">
        Le informazioni di base: il resto (luoghi, NPC, quest…) lo aggiungi
        strada facendo.
      </p>

      <form action={createCampaign} className="rounded-xl border border-border bg-surface p-6">
        <Field label="Nome" htmlFor="name">
          <Input id="name" name="name" required placeholder="Le Cronache di Aldenmoor" />
        </Field>
        <Field label="Ambientazione" htmlFor="setting" hint="Es. Forgotten Realms, un mondo homebrew...">
          <Input id="setting" name="setting" />
        </Field>
        <Field label="Sistema / regole" htmlFor="system" hint="Es. D&D 5e, Pathfinder 2e...">
          <Input id="system" name="system" placeholder="D&D 5e" />
        </Field>
        <Field label="Livello / periodo" htmlFor="level_or_period" hint="Es. Livelli 1-5, cronologicamente dopo la Guerra dei Draghi...">
          <Input id="level_or_period" name="level_or_period" />
        </Field>
        <Field label="Descrizione" htmlFor="description">
          <Textarea id="description" name="description" placeholder="Di cosa parla questa campagna?" />
        </Field>

        <div className="mt-6 flex justify-end gap-2">
          <ButtonLink href="/dashboard" variant="secondary">
            Annulla
          </ButtonLink>
          <SubmitButton pendingText="Creazione…">Crea campagna</SubmitButton>
        </div>
      </form>
    </div>
  );
}
