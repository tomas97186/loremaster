"use client";

import { useRef, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateSessionPrep, updateSessionPrep } from "../actions";
import { RichTextField, type RichTextFieldHandle } from "@/components/rich-text/rich-text-field";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { AutosaveIndicator } from "@/components/ui/autosave-indicator";
import { useAutosave } from "@/lib/hooks/use-autosave";
import type { MentionableEntity } from "@/lib/richtext";

export function SessionPrepForm({
  campaignId,
  sessionId,
  prepNotes,
  mentionable,
}: {
  campaignId: string;
  sessionId: string;
  prepNotes: string | null;
  mentionable: MentionableEntity[];
}) {
  const prepRef = useRef<RichTextFieldHandle>(null);
  const [prompt, setPrompt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { status, save } = useAutosave(async (html: string) => {
    const fd = new FormData();
    fd.set("prep_notes", html);
    await updateSessionPrep(campaignId, sessionId, fd);
  });

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateSessionPrep(campaignId, sessionId, prompt);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.prepNotes) prepRef.current?.setContent(result.prepNotes);
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-dashed border-border-strong bg-surface-2/50 p-4">
        <Field
          label="Genera la preparazione con l'AI"
          htmlFor="session-prep-prompt"
          hint="Scrivi un'idea, un tema o degli spunti per la sessione: verranno generate le note di preparazione qui sotto, e punti chiave e combattimenti direttamente nelle rispettive sezioni, usando anche gli elementi già collegati a questa sessione."
        >
          <Textarea
            id="session-prep-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Es. i giocatori arrivano in città inseguiti dalla gilda dei ladri..."
          />
        </Field>
        <Button type="button" size="sm" variant="secondary" onClick={handleGenerate} disabled={pending}>
          <Sparkles size={14} />
          {pending ? "Generazione…" : "Genera preparazione"}
        </Button>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <RichTextField
          ref={prepRef}
          label="Note di preparazione"
          id="prep_notes"
          name="prep_notes"
          defaultValue={prepNotes}
          mentionable={mentionable}
          campaignId={campaignId}
          hint="Scaletta, agganci narrativi, incontri previsti..."
          onChangeHtml={(html) => save(html)}
        />
        <AutosaveIndicator status={status} />
      </div>
    </div>
  );
}
