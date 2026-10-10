import { addNpcNote, deleteNpcNote } from "./actions";
import { Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmModalButton } from "@/components/ui/confirm-modal-button";
import type { NpcNote } from "@/lib/db/types";
import { formatDateTime } from "@/lib/utils";

export function NpcNotes({
  campaignId,
  npcId,
  notes,
}: {
  campaignId: string;
  npcId: string;
  notes: NpcNote[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="mb-3 font-display text-lg font-semibold text-text">Note</h3>
      <form action={addNpcNote.bind(null, campaignId, npcId)} className="mb-4 flex gap-2">
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
              className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <div>
                <p className="text-sm text-text">{note.content}</p>
                <p className="mt-0.5 text-xs text-text-muted">{formatDateTime(note.created_at)}</p>
              </div>
              <form action={deleteNpcNote.bind(null, campaignId, npcId, note.id)}>
                <ConfirmModalButton
                  className="text-xs text-text-muted hover:text-danger"
                  confirmMessage="Eliminare questa nota? L'azione non è reversibile."
                >
                  Elimina
                </ConfirmModalButton>
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
