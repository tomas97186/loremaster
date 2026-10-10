import {
  createEncounter,
  updateEncounter,
  deleteEncounter,
  toggleEncounterCompleted,
  type EncounterScope,
} from "./encounter-actions";
import { Field, Input } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Badge } from "@/components/ui/card";
import type { Encounter } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function EncounterEditor({
  campaignId,
  scope,
  encounters,
  mentionable,
}: {
  campaignId: string;
  scope: EncounterScope;
  encounters: Encounter[];
  mentionable: MentionableEntity[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-text">Combattimenti</h3>
          <p className="text-sm text-text-muted">
            Nemici, premi e punti esperienza per ogni scontro pianificato. Segnali come fatti
            durante la Live Mode.
          </p>
        </div>
        <form action={createEncounter.bind(null, campaignId, scope)}>
          <SubmitButton size="sm" variant="secondary" pendingText="Aggiunta…">
            + Aggiungi combattimento
          </SubmitButton>
        </form>
      </div>

      {encounters.length > 0 ? (
        <div className="space-y-4">
          {encounters.map((encounter, i) => (
            <details
              key={encounter.id}
              className="rounded-lg border border-border"
            >
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2">
                <span className="font-medium text-text">
                  {encounter.name || `Combattimento ${i + 1}`}
                </span>
                {encounter.completed ? <Badge tone="success">Fatto</Badge> : null}
                {encounter.xp ? <Badge tone="gold">{encounter.xp} PE</Badge> : null}
              </summary>
              <div className="border-t border-border p-3">
                <form action={updateEncounter.bind(null, campaignId, encounter.id, scope)}>
                  <div className="grid gap-x-4 sm:grid-cols-[1fr_auto]">
                    <Field label="Nome" htmlFor={`encounter-name-${encounter.id}`}>
                      <Input
                        id={`encounter-name-${encounter.id}`}
                        name="name"
                        placeholder={`Combattimento ${i + 1}`}
                        defaultValue={encounter.name ?? ""}
                      />
                    </Field>
                    <Field label="PE" htmlFor={`encounter-xp-${encounter.id}`}>
                      <Input
                        id={`encounter-xp-${encounter.id}`}
                        name="xp"
                        type="number"
                        min={0}
                        className="w-28"
                        defaultValue={encounter.xp ?? ""}
                      />
                    </Field>
                  </div>
                  <RichTextField
                    label="Nemici"
                    id={`encounter-enemies-${encounter.id}`}
                    name="enemies"
                    defaultValue={encounter.enemies}
                    mentionable={mentionable}
                    campaignId={campaignId}
                  />
                  <RichTextField
                    label="Premi"
                    id={`encounter-rewards-${encounter.id}`}
                    name="rewards"
                    defaultValue={encounter.rewards}
                    mentionable={mentionable}
                    campaignId={campaignId}
                    hint="Oggetti, oro, altri riconoscimenti."
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <SubmitButton size="sm">
                      Salva combattimento
                    </SubmitButton>
                  </div>
                </form>
                <div className="mt-2 flex justify-end gap-2">
                  <form
                    action={toggleEncounterCompleted.bind(
                      null,
                      campaignId,
                      encounter.id,
                      scope,
                      !encounter.completed,
                    )}
                  >
                    <SubmitButton size="sm" variant="secondary" pendingText="Aggiornamento…">
                      {encounter.completed ? "Segna da fare" : "Segna come fatto"}
                    </SubmitButton>
                  </form>
                  <form action={deleteEncounter.bind(null, campaignId, encounter.id, scope)}>
                    <ConfirmSubmitButton size="sm" confirmMessage="Eliminare questo combattimento?">
                      Elimina
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Nessun combattimento pianificato ancora.</p>
      )}
    </div>
  );
}
