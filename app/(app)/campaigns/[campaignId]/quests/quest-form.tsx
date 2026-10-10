"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import type { RichTextFieldHandle } from "@/components/rich-text/rich-text-field";
import { Button, ButtonLink } from "@/components/ui/button";
import { QUEST_STATUS_LABELS } from "@/lib/constants";
import { generateQuestContent } from "./actions";
import type { Quest, Location, Faction } from "@/lib/db/types";
import type { MentionableEntity } from "@/lib/richtext";

export function QuestForm({
  campaignId,
  action,
  quest,
  locations,
  factions,
  linkedNpcIds = [],
  mentionable,
}: {
  campaignId: string;
  action: (formData: FormData) => void;
  quest?: Quest;
  locations: Pick<Location, "id" | "name">[];
  factions: Pick<Faction, "id" | "name">[];
  linkedNpcIds?: string[];
  mentionable: MentionableEntity[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionRef = useRef<RichTextFieldHandle>(null);
  const publicNotesRef = useRef<RichTextFieldHandle>(null);
  const dmNotesRef = useRef<RichTextFieldHandle>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await generateQuestContent(campaignId, {
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        locationId: String(fd.get("location_id") ?? ""),
        npcIds: linkedNpcIds,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.description) descriptionRef.current?.setContent(result.description);
      if (result.publicNotes) publicNotesRef.current?.setContent(result.publicNotes);
      if (result.dmNotes) dmNotesRef.current?.setContent(result.dmNotes);
    });
  }

  return (
    <form ref={formRef} action={action} className="rounded-xl border border-border bg-surface p-6">
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Titolo" htmlFor="title">
          <Input id="title" name="title" required defaultValue={quest?.title} />
        </Field>
        <Field label="Stato" htmlFor="status">
          <Select id="status" name="status" defaultValue={quest?.status ?? "idea"}>
            {Object.entries(QUEST_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Luogo" htmlFor="location_id">
          <Select id="location_id" name="location_id" defaultValue={quest?.location_id ?? ""}>
            <option value="">— Nessuno —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fazione" htmlFor="faction_id">
          <Select id="faction_id" name="faction_id" defaultValue={quest?.faction_id ?? ""}>
            <option value="">— Nessuna —</option>
            {factions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mb-3 rounded-lg border border-dashed border-border-strong bg-surface-2/50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-text">
            Scrivi un accenno (facoltativo) e scegli il luogo, poi genera la missione completa:
            descrizione, obiettivi, segreti per il DM e ricompense.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleGenerate}
            disabled={pending}
            className="shrink-0"
          >
            <Sparkles size={14} />
            {pending ? "Generazione…" : "Genera missione con l'AI"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>

      <RichTextField
        ref={descriptionRef}
        label="Descrizione"
        id="description"
        name="description"
        defaultValue={quest?.description}
        mentionable={mentionable}
        campaignId={campaignId}
      />

      <RichTextField
        ref={publicNotesRef}
        label="Informazioni pubbliche"
        id="public_notes"
        name="public_notes"
        defaultValue={quest?.public_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Obiettivi noti ai giocatori."
      />
      <RichTextField
        ref={dmNotesRef}
        label="Note del DM"
        id="dm_notes"
        name="dm_notes"
        defaultValue={quest?.dm_notes}
        mentionable={mentionable}
        campaignId={campaignId}
        hint="Segrete: veri motivi, colpi di scena, ricompense. Visibili solo a te."
      />

      <div className="mt-6 flex justify-end gap-2">
        <ButtonLink href={`/campaigns/${campaignId}/quests`} variant="secondary">
          Annulla
        </ButtonLink>
        <Button type="submit">Salva</Button>
      </div>
    </form>
  );
}
