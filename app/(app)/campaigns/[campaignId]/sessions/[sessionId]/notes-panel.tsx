import { addSessionNote, deleteSessionNote } from "../actions";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { SessionNote } from "@/lib/db/types";
import { formatDateTime } from "@/lib/utils";

export function NotesPanel({
  campaignId,
  sessionId,
  notes,
}: {
  campaignId: string;
  sessionId: string;
  notes: SessionNote[];
}) {
  return (
    <div>
      <form action={addSessionNote.bind(null, campaignId, sessionId)} className="mb-4 flex gap-2">
        <Input type="text" name="content" placeholder="Nota rapida…" required autoComplete="off" />
        <SubmitButton size="sm" pendingText="Aggiunta…">
          Aggiungi
        </SubmitButton>
      </form>
      {notes.length > 0 ? (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <div>
                <p className="text-sm text-text">{note.content}</p>
                <p className="mt-0.5 text-xs text-text-muted">{formatDateTime(note.created_at)}</p>
              </div>
              <form action={deleteSessionNote.bind(null, campaignId, sessionId, note.id)}>
                <button type="submit" className="text-xs text-text-muted hover:text-danger">
                  Elimina
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">Nessuna nota ancora.</p>
      )}
    </div>
  );
}
