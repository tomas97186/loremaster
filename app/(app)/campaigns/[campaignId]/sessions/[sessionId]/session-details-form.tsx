"use client";

import { useRef } from "react";
import { updateSessionDetails, deleteSession } from "../actions";
import { Field, Input, Select } from "@/components/ui/field";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { AutosaveIndicator } from "@/components/ui/autosave-indicator";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import type { Session } from "@/lib/db/types";

function toLocalInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function SessionDetailsForm({
  campaignId,
  session,
}: {
  campaignId: string;
  session: Session;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { status, save } = useAutosave(async (formData: FormData) => {
    await updateSessionDetails(campaignId, session.id, formData);
  });

  function handleChange() {
    if (!formRef.current) return;
    save(new FormData(formRef.current));
  }

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        onChange={handleChange}
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-x-4 sm:grid-cols-4"
      >
        <Field label="Titolo" htmlFor="title" className="sm:col-span-2">
          <Input id="title" name="title" required defaultValue={session.title} />
        </Field>
        <Field label="Numero" htmlFor="session_number">
          <Input
            id="session_number"
            name="session_number"
            type="number"
            min={1}
            defaultValue={session.session_number ?? ""}
          />
        </Field>
        <Field label="Stato" htmlFor="status">
          <Select id="status" name="status" defaultValue={session.status}>
            {Object.entries(SESSION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data e ora" htmlFor="scheduled_at" className="sm:col-span-2">
          <Input
            id="scheduled_at"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={toLocalInputValue(session.scheduled_at)}
          />
        </Field>
        <div className="flex items-end sm:col-span-2 sm:justify-end">
          <AutosaveIndicator status={status} />
        </div>
      </form>

      <form action={deleteSession.bind(null, campaignId, session.id)} className="flex justify-end">
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare la sessione "${session.title}"? L'azione non è reversibile.`}
        >
          Elimina sessione
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
