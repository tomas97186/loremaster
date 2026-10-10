"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { updateSessionSummary, generateSessionSummary } from "../actions";
import { Field, Input } from "@/components/ui/field";
import { RichTextField, type RichTextFieldHandle } from "@/components/rich-text/rich-text-field";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import type { MentionableEntity } from "@/lib/richtext";

/** Form di scrittura/modifica del resoconto, condiviso tra la tab "Resoconto" (sessione in corso) e la vista di sola lettura (sessione conclusa). */
export function ResocontoForm({
  campaignId,
  sessionId,
  summary,
  xpAwarded,
  autoXp,
  mentionable,
  showGenerate = true,
}: {
  campaignId: string;
  sessionId: string;
  summary: string | null;
  xpAwarded: number | null;
  autoXp: number;
  mentionable: MentionableEntity[];
  showGenerate?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<RichTextFieldHandle>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateSessionSummary(campaignId, sessionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.html) summaryRef.current?.setContent(result.html);
    });
  }

  return (
    <div>
      {showGenerate ? (
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-dashed border-border-strong bg-surface-2/50 p-3">
          <p className="text-sm text-text">
            Genera una bozza dal titolo, dalle note di preparazione, dai combattimenti e dalle
            note rapide prese durante il gioco.
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
            {pending ? "Generazione…" : "Genera riepilogo"}
          </Button>
        </div>
      ) : null}
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <form action={updateSessionSummary.bind(null, campaignId, sessionId)}>
        <RichTextField
          ref={summaryRef}
          label="Resoconto della sessione"
          id="summary"
          name="summary"
          defaultValue={summary}
          mentionable={mentionable}
          campaignId={campaignId}
          hint="Cosa è successo, come sono andate le cose, agganci per la prossima volta."
        />
        <Field
          label="Punti esperienza guadagnati"
          htmlFor="xp_awarded"
          hint={
            autoXp > 0
              ? `Calcolati dai combattimenti segnati come fatti (${autoXp}). Modificali pure.`
              : "Segna i combattimenti come fatti in Live Mode per un calcolo automatico, o inseriscili a mano."
          }
        >
          <Input
            id="xp_awarded"
            name="xp_awarded"
            type="number"
            min={0}
            defaultValue={xpAwarded ?? (autoXp || "")}
          />
        </Field>
        <SubmitButton size="sm">Salva resoconto</SubmitButton>
      </form>
    </div>
  );
}
